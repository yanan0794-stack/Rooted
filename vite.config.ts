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
const DEFAULT_QIANFAN_MODEL = 'qwen3-vl-235b-a22b-instruct';
const DEFAULT_ELEVENLABS_MODEL = 'eleven_multilingual_v2';
const DEFAULT_ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel, premade female voice
const IDENTIFICATION_CONFIDENCE_THRESHOLD = 0.75;
const CARE_GROUP_CATEGORIES = ['Watering', 'Light', 'Soil & Fertilizer', 'Pruning & Cleaning'];
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

function folderForUser(user: { name?: string } | null) {
  return user?.name
    ? user.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    : 'guest';
}

function toProjectRelativePath(absPath: string) {
  return path.relative(__dirname, absPath).split(path.sep).join('/');
}

function mimeForPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function imageBufferFromDataUrl(data: string) {
  const match = data.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Image data is invalid.');
  return {
    buffer: Buffer.from(match[2], 'base64'),
    mime: match[1],
  };
}

function imageExtension(filename: string, mime: string) {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return ext === '.jpeg' ? '.jpg' : ext;
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}

function contentTypeForExtension(ext: string) {
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

async function storeImageData(
  client: any,
  options: {
    filename: string;
    data: string;
    folder: string;
    secretId: string;
    secretKey: string;
    bucket: string;
    region: string;
    domain?: string;
  },
) {
  const { buffer, mime } = imageBufferFromDataUrl(options.data);
  const ext = imageExtension(options.filename, mime);

  if (options.secretId && options.secretKey && options.bucket) {
    const key = `rooted/${options.folder}/${Date.now()}${ext}`;
    await new Promise<void>((resolve, reject) =>
      client.putObject(
        {
          Bucket: options.bucket,
          Region: options.region,
          Key: key,
          Body: buffer,
          ContentType: contentTypeForExtension(ext),
        },
        (err: Error | null) => (err ? reject(err) : resolve()),
      ),
    );
    return cosPublicUrl(options.bucket, options.region, options.domain, key);
  }

  const relPath = `data/images/${options.folder}/${Date.now()}${ext}`;
  const absPath = path.resolve(__dirname, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, buffer);
  return relPath;
}

function localImageSrc(imageUrl: string) {
  if (!imageUrl || /^(https?:|data:)/.test(imageUrl)) return imageUrl;

  const absPath = path.resolve(__dirname, imageUrl);
  if (!absPath.startsWith(DATA_DIR) || !fs.existsSync(absPath)) return '';

  const encoded = fs.readFileSync(absPath).toString('base64');
  return `data:${mimeForPath(absPath)};base64,${encoded}`;
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

function hasUsableSecret(value: string) {
  return Boolean(value && !/^(YOUR_|MY_|PASTE_|INSERT_)/i.test(value.trim()));
}

function aiErrorMessage(status: number, model: string, body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: { code?: string; message?: string } };
    const code = parsed.error?.code ? `${parsed.error.code}: ` : '';
    const message = parsed.error?.message ?? body;
    return `AI API ${status} for model "${model}": ${code}${message}`;
  } catch {
    return `AI API ${status} for model "${model}": ${body}`;
  }
}

function cleanString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeConfidence(value: unknown) {
  const numeric = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number.parseFloat(value)
      : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  const normalized = numeric > 10 ? numeric / 100 : numeric > 1 ? numeric / 10 : numeric;
  return Math.max(0, Math.min(1, normalized));
}

function hasConfidenceValue(value: unknown) {
  return value !== null && value !== undefined && (typeof value !== 'string' || value.trim() !== '');
}

function normalizeIsPlant(value: unknown) {
  if (value === true || value === false) return value;
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (['true', 'yes', 'y', 'plant'].includes(normalized)) return true;
  if (['false', 'no', 'n', 'none', 'no plant', 'not a plant', 'non-plant'].includes(normalized)) return false;
  return null;
}

function cleanStringList(value: unknown, limit: number) {
  return Array.isArray(value)
    ? value.map(item => cleanString(item)).filter(item => item && !hasUnknownMeaning(item)).slice(0, limit)
    : [];
}

function normalizeQuickFacts(value: any) {
  return {
    difficulty: cleanString(value?.difficulty),
    light: cleanString(value?.light),
    water: cleanString(value?.water),
    humidity: cleanString(value?.humidity),
  };
}

function normalizeTaskGroups(value: unknown) {
  const groups = Array.isArray(value) ? value : [];
  return CARE_GROUP_CATEGORIES.map((category) => {
    const matched = groups.find((group: any) => cleanString(group?.category).toLowerCase() === category.toLowerCase());
    const tasks = Array.isArray(matched?.tasks)
      ? matched.tasks
          .map((task: any) => ({
            title: cleanString(task?.title),
            detail: cleanString(task?.detail),
            frequency: cleanString(task?.frequency),
          }))
          .filter((task: any) => task.title && task.detail && task.frequency)
          .filter((task: any) => ![task.title, task.detail, task.frequency].some(hasUnknownMeaning))
          .slice(0, 3)
      : [];

    return { category, tasks };
  });
}

function buildVideoGuide(result: any, parsedGuide: any) {
  const parsedScenes = Array.isArray(parsedGuide?.scenes)
    ? parsedGuide.scenes
        .map((scene: any) => ({
          title: cleanString(scene?.title),
          caption: cleanString(scene?.caption),
          detail: cleanString(scene?.detail),
          duration: Math.max(4, Math.min(10, Number(scene?.duration) || 6)),
        }))
        .filter((scene: any) => scene.title && scene.caption)
        .slice(0, 5)
    : [];

  const fallbackScenes = [
    {
      title: `Meet ${result.plant}`,
      caption: result.description,
      detail: result.scientificName,
      duration: 7,
    },
    {
      title: 'Light',
      caption: result.quickFacts.light || 'Use bright, stable light suited to the plant.',
      detail: result.taskGroups.find((group: any) => group.category === 'Light')?.tasks?.[0]?.detail ?? '',
      duration: 6,
    },
    {
      title: 'Water',
      caption: result.quickFacts.water || 'Water only when the soil and season call for it.',
      detail: result.taskGroups.find((group: any) => group.category === 'Watering')?.tasks?.[0]?.detail ?? '',
      duration: 6,
    },
    {
      title: 'Care Rhythm',
      caption: result.tips[0] || 'Check the leaves, soil, and light before each care session.',
      detail: result.taskGroups.find((group: any) => group.tasks.length > 0)?.tasks?.[0]?.frequency ?? '',
      duration: 6,
    },
  ].filter(scene => scene.caption);

  return {
    title: cleanString(parsedGuide?.title, `${result.plant} AI Care Video`),
    scenes: parsedScenes.length >= 3 ? parsedScenes : fallbackScenes,
  };
}

function hasUnknownMeaning(value: string) {
  return /(^|\b)(unknown|uncertain|no plant|not a plant|n\/a)(\b|$)/i.test(value);
}

function identificationError(result: any, isPlant: boolean | null, hasModelConfidence: boolean) {
  const taskCount = result.taskGroups.reduce((sum: number, group: any) => sum + group.tasks.length, 0);
  const hasNamedPlant = Boolean(result.plant) && !hasUnknownMeaning(result.plant);

  if (isPlant === false || !hasNamedPlant) {
    return 'No clear plant was detected. Please scan a close, well-lit photo of the leaves or flowers.';
  }
  if (result.visualEvidence.length < 2 || !result.diagnosticNotes) {
    return 'The AI could not explain the identification from visible plant traits. Please rescan with clear leaves, stems, or flowers.';
  }
  if (hasModelConfidence && result.confidence < IDENTIFICATION_CONFIDENCE_THRESHOLD) {
    return `The AI was only ${Math.round(result.confidence * 100)}% confident. Please rescan from another angle so the guide data stays accurate.`;
  }
  if (!result.scientificName || hasUnknownMeaning(result.scientificName)) {
    return 'The AI could not verify the botanical name. Please rescan with a clearer plant photo.';
  }
  if (!result.description || !result.quickFacts.light || !result.quickFacts.water || taskCount < 4) {
    return 'The AI result was incomplete. Please rescan so Rooted can build a complete care guide.';
  }

  return '';
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
          const folder = folderForUser(user);
          const storedPath = await storeImageData(client, {
            filename,
            data,
            folder,
            secretId,
            secretKey,
            bucket,
            region,
            domain,
          });

          res.end(JSON.stringify({ ok: true, path: storedPath }));
        } catch (err) {
          jsonError(res, 500, String(err));
        }
      });
    },
  };
}

// ── Plugin: /api/library  (local saved scan guides) ───────────
function libraryApiPlugin() {
  return {
    name: 'library-api',
    configureServer(server: any) {
      server.middlewares.use('/api/library', async (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          if (req.method !== 'GET') { jsonError(res, 405, 'Method not allowed'); return; }

          const user = stmt.getSessionUser.get() as { name?: string } | null;
          const folder = folderForUser(user);
          const libraryDir = path.join(DATA_DIR, 'images', folder);

          if (!fs.existsSync(libraryDir)) {
            res.end(JSON.stringify({ plants: [] }));
            return;
          }

          const plants = fs.readdirSync(libraryDir)
            .filter(file => file.endsWith('.json'))
            .map(file => {
              try {
                const absJsonPath = path.join(libraryDir, file);
                const parsed = JSON.parse(fs.readFileSync(absJsonPath, 'utf8'));

                return {
                  ...parsed,
                  jsonPath: parsed.jsonPath ?? toProjectRelativePath(absJsonPath),
                  imageSrc: localImageSrc(parsed.imageUrl ?? ''),
                  confidence: normalizeConfidence(parsed.confidence),
                  alternatives: cleanStringList(parsed.alternatives, 3),
                  visualEvidence: cleanStringList(parsed.visualEvidence, 4),
                  diagnosticNotes: cleanString(parsed.diagnosticNotes),
                  quickFacts: parsed.quickFacts ?? { difficulty: '', light: '', water: '', humidity: '' },
                  taskGroups: Array.isArray(parsed.taskGroups)
                    ? parsed.taskGroups.map((group: any) => ({
                        category: group.category ?? 'Care',
                        tasks: Array.isArray(group.tasks)
                          ? group.tasks.map((task: any, index: number) => ({
                              id: task.id ?? `${group.category ?? 'care'}-${index}`,
                              title: task.title ?? 'Care task',
                              detail: task.detail ?? '',
                              frequency: task.frequency ?? '',
                              done: Boolean(task.done),
                            }))
                          : [],
                      }))
                    : [],
                  tips: Array.isArray(parsed.tips) ? parsed.tips : [],
                  videoGuide: buildVideoGuide(parsed, parsed.videoGuide),
                };
              } catch {
                return null;
              }
            })
            .filter(Boolean)
            .sort((a: any, b: any) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());

          res.end(JSON.stringify({ plants }));
        } catch (err) {
          jsonError(res, 500, String(err));
        }
      });
    },
  };
}

// ── Plugin: /api/narrate  (ElevenLabs TTS) ───────────────────
function narrationApiPlugin(apiKey: string, voiceId: string, modelId: string) {
  return {
    name: 'narration-api',
    configureServer(server: any) {
      server.middlewares.use('/api/narrate', async (req: any, res: any) => {
        const enabled = hasUsableSecret(apiKey);
        res.setHeader('Access-Control-Allow-Origin', '*');

        try {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              enabled,
              provider: 'elevenlabs',
              voiceId,
              voiceName: voiceId === DEFAULT_ELEVENLABS_VOICE_ID ? 'Rachel' : 'Custom voice',
              modelId,
            }));
            return;
          }

          if (req.method !== 'POST') { jsonError(res, 405, 'Method not allowed'); return; }
          if (!enabled) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, enabled: false, error: 'ELEVENLABS_API_KEY is not configured.' }));
            return;
          }

          const { text } = JSON.parse(await readBody(req)) as { text?: string };
          const cleanText = cleanString(text).slice(0, 900);
          if (!cleanText) { jsonError(res, 400, 'Narration text is required.'); return; }

          const speechRes = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
            {
              method: 'POST',
              headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: cleanText,
                model_id: modelId,
                voice_settings: {
                  stability: 0.55,
                  similarity_boost: 0.78,
                  style: 0.24,
                  use_speaker_boost: true,
                },
              }),
            },
          );

          if (!speechRes.ok) {
            jsonError(res, 502, `ElevenLabs ${speechRes.status}: ${await speechRes.text()}`); return;
          }

          const audio = Buffer.from(await speechRes.arrayBuffer());
          res.statusCode = 200;
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'private, max-age=3600');
          res.end(audio);
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
  aiModel: string,
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
        let imagePathPromise: Promise<string> | null = null;
        let imageSaveError: unknown = null;
        try {
          if (req.method !== 'POST') { jsonError(res, 405, 'Method not allowed'); return; }
          if (!apiKey || !appId) {
            jsonError(res, 500, 'API_KEY and APP_ID must be set in your .env file.'); return;
          }

          const { imageData, imagePath, filename } = JSON.parse(await readBody(req)) as {
            imageData: string;
            imagePath?: string;
            filename?: string;
          };

          if (!imageData) {
            jsonError(res, 400, 'Image data is required.'); return;
          }

          const user = stmt.getSessionUser.get() as { name?: string } | null;
          const folder = folderForUser(user);
          imagePathPromise = (imagePath
            ? Promise.resolve(imagePath)
            : storeImageData(client, {
                filename: filename || `plant_${Date.now()}.jpg`,
                data: imageData,
                folder,
                secretId,
                secretKey,
                bucket,
                region,
                domain,
              }))
            .catch((err) => {
              imageSaveError = err;
              return '';
            });

          // ── Call Qianfan / vision model ──────────────────────
          const aiRes = await fetch('https://qianfan.baidubce.com/v2/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'appid': appId,
            },
            body: JSON.stringify({
              model: aiModel,
              messages: [
                {
                  role: 'system',
                  content: 'You are a botanical visual identification verifier. Accuracy is more important than giving an answer. First infer only visible traits from the image, then choose a plant name only when those traits support it. If the exact species is uncertain, use a genus-level name, list lookalikes, lower confidence, and do not invent care research. Respond ONLY with valid JSON.',
                },
                {
                  role: 'user',
                  content: [
                    { type: 'image_url', image_url: { url: imageData } },
                    {
                      type: 'text',
                      text: `Identify this plant only from visible image evidence, then build a care guide only if the identification is supported. Respond ONLY with JSON matching this exact shape:
{"isPlant":true,"confidence":0.0,"plant":"Common Name or Genus sp.","scientificName":"Genus species or Genus sp.","alternatives":["Possible lookalike 1","Possible lookalike 2"],"visualEvidence":["visible leaf/stem/flower trait 1","visible trait 2"],"diagnosticNotes":"One concise sentence explaining why this ID fits and how it differs from the closest lookalike.","description":"Two concise, care-relevant sentences. Mention visual traits and habitat only if known; avoid folklore, symbolism, or decorative claims.","quickFacts":{"difficulty":"Easy|Medium|Hard","light":"specific indoor/outdoor light range","water":"soil dryness cue plus approximate interval","humidity":"specific humidity preference"},"taskGroups":[{"category":"Watering","tasks":[{"title":"Short action title","detail":"Specific step-by-step instruction for this plant.","frequency":"e.g. Weekly"}]},{"category":"Light","tasks":[{"title":"...","detail":"...","frequency":"..."}]},{"category":"Soil & Fertilizer","tasks":[{"title":"...","detail":"...","frequency":"..."}]},{"category":"Pruning & Cleaning","tasks":[{"title":"...","detail":"...","frequency":"..."}]}],"tips":["Accurate pro tip 1","Accurate pro tip 2","Accurate pro tip 3"],"videoGuide":{"title":"Short video title","scenes":[{"title":"Scene title","caption":"Voiceover line using the plant data.","detail":"Short on-screen detail.","duration":6}]}}
Rules:
- Set isPlant=false and confidence below 0.5 if no plant is visible.
- Confidence must reflect visual certainty: below 0.75 for blurry, partial, juvenile, or lookalike-heavy photos; 0.75-0.85 for plausible but not diagnostic; above 0.85 only when multiple diagnostic traits are visible.
- If you cannot support the exact species from visible traits, use "Genus sp." or return low confidence. Do not guess a precise species just to complete the guide.
- Always provide 2-4 visualEvidence items for successful IDs. They must be visible in the photo, not general facts.
- Do not fabricate research. Care guidance must be standard horticultural care for the selected species/genus and must include condition-based watering, not a fixed schedule alone.
- Compare common lookalikes before finalizing. Important: small coin-shaped opposite leaves on reddish/purple thin stems are more consistent with Portulacaria afra (Elephant Bush) than Crassula ovata (Jade Plant); Jade usually has larger thick oval leaves and woodier stems. Also distinguish Pilea/Peperomia, Pothos/Philodendron, Monstera/Rhaphidophora, Aloe/Haworthia, and Dracaena/Sansevieria.
- Use "alternatives" for plausible similar species and explain the difference in diagnosticNotes.
- Provide all 4 task groups with 1-3 actionable tasks each only when confidence is 0.75 or higher.
- Provide 3-5 videoGuide scenes that reuse the identified plant and care data text.`,
                    },
                  ],
                },
              ],
              response_format: { type: 'json_object' },
              max_tokens: 1400,
            }),
          });

          if (!aiRes.ok) {
            jsonError(res, 502, aiErrorMessage(aiRes.status, aiModel, await aiRes.text())); return;
          }

          const completion = (await aiRes.json()) as { choices: { message: { content: string } }[] };
          const parsed = JSON.parse(completion.choices[0].message.content);
          const hasModelConfidence = hasConfidenceValue(parsed.confidence);

          const normalized = {
            plant:          cleanString(parsed.plant, 'Unknown Plant'),
            scientificName: cleanString(parsed.scientificName),
            description:    cleanString(parsed.description),
            confidence:     hasModelConfidence ? normalizeConfidence(parsed.confidence) : 0.75,
            alternatives:   cleanStringList(parsed.alternatives, 3),
            visualEvidence: cleanStringList(parsed.visualEvidence, 4),
            diagnosticNotes: cleanString(parsed.diagnosticNotes),
            quickFacts:     normalizeQuickFacts(parsed.quickFacts),
            taskGroups:     normalizeTaskGroups(parsed.taskGroups),
            tips:           cleanStringList(parsed.tips, 3),
          };

          const invalidMessage = identificationError(normalized, normalizeIsPlant(parsed.isPlant), hasModelConfidence);
          if (invalidMessage) {
            res.end(JSON.stringify({ ok: false, retryable: true, error: invalidMessage })); return;
          }

          const storedImagePath = await imagePathPromise;
          if (imageSaveError || !storedImagePath) {
            throw imageSaveError || new Error('Image save failed');
          }

          const result = {
            id:             Date.now().toString(),
            scannedAt:      new Date().toISOString(),
            ...normalized,
            imageUrl:       storedImagePath,
            videoGuide:     buildVideoGuide(normalized, parsed.videoGuide),
          };

          // ── Persist JSON: COS if configured, local otherwise ──
          const jsonBody = Buffer.from(JSON.stringify(result, null, 2));

          if (secretId && secretKey && bucket && storedImagePath.startsWith('https://')) {
            const jsonKey = cosKeyFromUrl(storedImagePath).replace(/\.[^.]+$/, '.json');
            const jsonUrl = cosPublicUrl(bucket, region, domain, jsonKey);
            await new Promise<void>((resolve, reject) =>
              client.putObject(
                { Bucket: bucket, Region: region, Key: jsonKey, Body: jsonBody, ContentType: 'application/json' },
                (err: Error | null) => (err ? reject(err) : resolve()),
              ),
            );
            res.end(JSON.stringify({ ...result, jsonPath: jsonUrl }));
          } else {
            const jsonRelPath = storedImagePath.replace(/\.[^.]+$/, '.json');
            const absJsonPath = path.resolve(__dirname, jsonRelPath);
            fs.mkdirSync(path.dirname(absJsonPath), { recursive: true });
            fs.writeFileSync(absJsonPath, jsonBody);
            res.end(JSON.stringify({ ...result, jsonPath: jsonRelPath }));
          }
        } catch (err) {
          await imagePathPromise?.catch(() => '');
          jsonError(res, 500, String(err));
        }
      });
    },
  };
}

// Register the /api/* middlewares on the preview server too, so `npm start`
// (vite preview) serves the same backend as the dev server.
function withPreview(plugin: any) {
  return { ...plugin, configurePreviewServer: plugin.configureServer };
}

// ── Vite config ───────────────────────────────────────────────
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const aiModel = env.QIANFAN_MODEL || env.AI_MODEL || DEFAULT_QIANFAN_MODEL;
  const elevenLabs = {
    apiKey:  env.ELEVENLABS_API_KEY ?? '',
    voiceId: env.ELEVENLABS_VOICE_ID || DEFAULT_ELEVENLABS_VOICE_ID,
    model:   env.ELEVENLABS_MODEL || DEFAULT_ELEVENLABS_MODEL,
  };

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
      withPreview(userApiPlugin()),
      withPreview(uploadApiPlugin(cos.secretId, cos.secretKey, cos.bucket, cos.region, cos.domain)),
      withPreview(libraryApiPlugin()),
      withPreview(narrationApiPlugin(elevenLabs.apiKey, elevenLabs.voiceId, elevenLabs.model)),
      withPreview(identifyApiPlugin(env.API_KEY, env.APP_ID, aiModel, cos.secretId, cos.secretKey, cos.bucket, cos.region, cos.domain)),
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
    preview: {
      // Public domain this app is served from via `vite preview` (npm start).
      // Leading dot allows the apex domain and all subdomains (e.g. www).
      allowedHosts: ['.rootedhelper.com'],
    },
  };
});
