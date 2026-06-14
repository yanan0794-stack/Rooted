import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// CJS interop — required for native addon (better-sqlite3) and CJS-only SDK (cos-nodejs-sdk-v5)
const _require = createRequire(import.meta.url);

// ── SQLite: initialised once at Vite startup ──────────────────
const DATA_DIR = path.resolve(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const BetterSqlite = _require('better-sqlite3');
const db = new BetterSqlite(path.join(DATA_DIR, 'rooted.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT,
    avatar     TEXT,
    provider   TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT DEFAULT (datetime('now'))
  );

  -- Single-row table: tracks the currently logged-in user
  CREATE TABLE IF NOT EXISTS session (
    singleton  INTEGER PRIMARY KEY DEFAULT 1 CHECK (singleton = 1),
    user_id    TEXT REFERENCES users(id)
  );
  INSERT OR IGNORE INTO session (singleton, user_id) VALUES (1, NULL);
`);

const stmt = {
  getSessionUser: db.prepare(`
    SELECT u.* FROM session s
    LEFT JOIN users u ON u.id = s.user_id
    WHERE s.singleton = 1
  `),
  upsertUser: db.prepare(`
    INSERT INTO users (id, name, email, avatar, provider, last_login)
    VALUES (@id, @name, @email, @avatar, @provider, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name       = excluded.name,
      email      = excluded.email,
      avatar     = excluded.avatar,
      provider   = excluded.provider,
      last_login = datetime('now')
  `),
  setSession:   db.prepare(`UPDATE session SET user_id = @id  WHERE singleton = 1`),
  clearSession: db.prepare(`UPDATE session SET user_id = NULL WHERE singleton = 1`),
};

// ── Shared helpers ─────────────────────────────────────────────
function cosPublicUrl(bucket: string, region: string, domain: string | undefined, key: string) {
  return domain
    ? `https://${domain}/${key}`
    : `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
}

function cosKeyFromUrl(url: string) {
  // "https://host/key" → "key"
  return url.replace(/^https?:\/\/[^/]+\//, '');
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });
}

function jsonError(res: any, status: number, message: string) {
  if (!res.headersSent) {
    res.statusCode = status;
    res.end(JSON.stringify({ error: message }));
  }
}

// ── Plugin: /api/user  (SQLite session) ───────────────────────
function userApiPlugin() {
  return {
    name: 'user-api',
    configureServer(server: any) {
      server.middlewares.use('/api/user', async (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          if (req.method === 'GET') {
            res.end(JSON.stringify(stmt.getSessionUser.get() ?? null));
            return;
          }

          if (req.method === 'POST') {
            const user = JSON.parse(await readBody(req));
            stmt.upsertUser.run(user);
            stmt.setSession.run({ id: user.id });
            res.end('{"ok":true}');
            return;
          }

          if (req.method === 'DELETE') {
            stmt.clearSession.run();
            res.end('{"ok":true}');
            return;
          }

          jsonError(res, 405, 'Method not allowed');
        } catch (err) {
          jsonError(res, 500, String(err));
        }
      });
    },
  };
}

// ── Plugin: /api/upload  (Tencent COS) ────────────────────────
function uploadApiPlugin(secretId: string, secretKey: string, bucket: string, region: string, domain?: string) {
  return {
    name: 'upload-api',
    configureServer(server: any) {
      const COS = _require('cos-nodejs-sdk-v5');
      const client = new COS({ SecretId: secretId, SecretKey: secretKey });

      server.middlewares.use('/api/upload', async (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          if (req.method !== 'POST') { jsonError(res, 405, 'Method not allowed'); return; }

          const { filename, data } = JSON.parse(await readBody(req)) as { filename: string; data: string };

          const user = stmt.getSessionUser.get() as { name?: string } | null;
          const folder = user?.name
            ? user.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
            : 'guest';

          const ext  = path.extname(filename) || '.jpg';
          const buf  = Buffer.from(data.replace(/^data:[^;]+;base64,/, ''), 'base64');

          // ── COS upload (when credentials present) ───────────
          if (secretId && secretKey && bucket) {
            const key = `rooted/${folder}/${Date.now()}${ext}`;
            await new Promise<void>((resolve, reject) =>
              client.putObject(
                { Bucket: bucket, Region: region, Key: key, Body: buf, ContentType: `image/${ext.slice(1)}` },
                (err: Error | null) => (err ? reject(err) : resolve()),
              ),
            );
            res.end(JSON.stringify({ ok: true, path: cosPublicUrl(bucket, region, domain, key) }));
            return;
          }

          // ── Local fallback (no COS credentials) ─────────────
          const relPath = `data/images/${folder}/${Date.now()}${ext}`;
          const absPath = path.resolve(__dirname, relPath);
          fs.mkdirSync(path.dirname(absPath), { recursive: true });
          fs.writeFileSync(absPath, buf);
          res.end(JSON.stringify({ ok: true, path: relPath }));
        } catch (err) {
          jsonError(res, 500, String(err));
        }
      });
    },
  };
}

// ── Plugin: /api/identify  (AI inference + COS JSON storage) ──
function identifyApiPlugin(
  apiKey: string,
  appId: string,
  secretId: string,
  secretKey: string,
  bucket: string,
  region: string,
  domain?: string,
) {
  return {
    name: 'identify-api',
    configureServer(server: any) {
      const COS = _require('cos-nodejs-sdk-v5');
      const client = new COS({ SecretId: secretId, SecretKey: secretKey });

      server.middlewares.use('/api/identify', async (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          if (req.method !== 'POST') { jsonError(res, 405, 'Method not allowed'); return; }
          if (!apiKey || !appId) {
            jsonError(res, 500, 'API_KEY and APP_ID must be set in your .env file.'); return;
          }

          const { imageData, imagePath } = JSON.parse(await readBody(req)) as {
            imageData: string;
            imagePath: string;
          };

          // ── Call Qianfan / vision model ──────────────────────
          const aiRes = await fetch('https://qianfan.baidubce.com/v2/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'appid': appId,
            },
            body: JSON.stringify({
              model: 'qwen3-vl-235b-a22b-thinking',
              enable_thinking: false,
              messages: [
                {
                  role: 'system',
                  content: 'You are a botanist and plant care expert. Identify plants from images and respond ONLY with valid JSON.',
                },
                {
                  role: 'user',
                  content: [
                    { type: 'image_url', image_url: { url: imageData } },
                    {
                      type: 'text',
                      text: `Identify this plant. Respond ONLY with JSON matching this exact shape:\n{"plant":"Common Name","scientificName":"Genus species","description":"Two sentences about this plant and its origin.","quickFacts":{"difficulty":"Easy|Medium|Hard","light":"e.g. Bright indirect","water":"e.g. Every 7-10 days","humidity":"e.g. High (50-60%)"},"taskGroups":[{"category":"Watering","tasks":[{"title":"Short action title","detail":"Step-by-step instruction.","frequency":"e.g. Weekly"}]},{"category":"Light","tasks":[{"title":"...","detail":"...","frequency":"..."}]},{"category":"Soil & Fertilizer","tasks":[{"title":"...","detail":"...","frequency":"..."}]},{"category":"Pruning & Cleaning","tasks":[{"title":"...","detail":"...","frequency":"..."}]}],"tips":["Pro tip 1","Pro tip 2","Pro tip 3"]}\nProvide 4 task groups with 1-3 specific, actionable tasks each.`,
                    },
                  ],
                },
              ],
              response_format: { type: 'json_object' },
              max_tokens: 800,
            }),
          });

          if (!aiRes.ok) {
            jsonError(res, 502, `AI API ${aiRes.status}: ${await aiRes.text()}`); return;
          }

          const completion = (await aiRes.json()) as { choices: { message: { content: string } }[] };
          const parsed = JSON.parse(completion.choices[0].message.content);

          const result = {
            id:             Date.now().toString(),
            scannedAt:      new Date().toISOString(),
            plant:          parsed.plant          ?? 'Unknown Plant',
            scientificName: parsed.scientificName ?? '',
            description:    parsed.description    ?? '',
            imageUrl:       imagePath,
            quickFacts:     parsed.quickFacts     ?? { difficulty: '', light: '', water: '', humidity: '' },
            taskGroups:     Array.isArray(parsed.taskGroups) ? parsed.taskGroups : [],
            tips:           Array.isArray(parsed.tips)       ? parsed.tips       : [],
          };

          // ── Persist JSON: COS if configured, local otherwise ──
          const jsonBody = Buffer.from(JSON.stringify(result, null, 2));

          if (secretId && secretKey && bucket && imagePath.startsWith('https://')) {
            const jsonKey = cosKeyFromUrl(imagePath).replace(/\.[^.]+$/, '.json');
            const jsonUrl = cosPublicUrl(bucket, region, domain, jsonKey);
            await new Promise<void>((resolve, reject) =>
              client.putObject(
                { Bucket: bucket, Region: region, Key: jsonKey, Body: jsonBody, ContentType: 'application/json' },
                (err: Error | null) => (err ? reject(err) : resolve()),
              ),
            );
            res.end(JSON.stringify({ ...result, jsonPath: jsonUrl }));
          } else {
            const jsonRelPath = imagePath.replace(/\.[^.]+$/, '.json');
            const absJsonPath = path.resolve(__dirname, jsonRelPath);
            fs.mkdirSync(path.dirname(absJsonPath), { recursive: true });
            fs.writeFileSync(absJsonPath, jsonBody);
            res.end(JSON.stringify({ ...result, jsonPath: jsonRelPath }));
          }
        } catch (err) {
          jsonError(res, 500, String(err));
        }
      });
    },
  };
}

// ── Vite config ───────────────────────────────────────────────
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  const cos = {
    secretId:  env.COS_SECRET_ID  ?? '',
    secretKey: env.COS_SECRET_KEY ?? '',
    bucket:    env.COS_BUCKET     ?? '',
    region:    env.COS_REGION     || 'ap-guangzhou',
    domain:    env.COS_DOMAIN     || undefined,
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
      userApiPlugin(),
      uploadApiPlugin(cos.secretId, cos.secretKey, cos.bucket, cos.region, cos.domain),
      identifyApiPlugin(env.API_KEY, env.APP_ID, cos.secretId, cos.secretKey, cos.bucket, cos.region, cos.domain),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
