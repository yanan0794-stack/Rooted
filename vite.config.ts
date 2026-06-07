import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const USER_JSON = path.resolve(__dirname, 'data/user.json');

function userApiPlugin() {
  return {
    name: 'user-api',
    configureServer(server: { middlewares: { use: (path: string, handler: (req: any, res: any) => void) => void } }) {
      server.middlewares.use('/api/user', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'GET') {
          try {
            const data = fs.readFileSync(USER_JSON, 'utf-8').trim();
            res.end(data || 'null');
          } catch {
            res.end('null');
          }
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk; });
          req.on('end', () => {
            fs.writeFileSync(USER_JSON, body);
            res.end('{"ok":true}');
          });
          return;
        }

        if (req.method === 'DELETE') {
          fs.writeFileSync(USER_JSON, 'null');
          res.end('{"ok":true}');
          return;
        }

        res.statusCode = 405;
        res.end('{"error":"Method not allowed"}');
      });
    },
  };
}

const IMAGES_DIR = path.resolve(__dirname, 'data', 'images');

function uploadApiPlugin() {
  return {
    name: 'upload-api',
    configureServer(server: { middlewares: { use: (path: string, handler: (req: any, res: any) => void) => void } }) {
      server.middlewares.use('/api/upload', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('{"error":"Method not allowed"}');
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk; });
        req.on('end', () => {
          try {
            const { filename, data } = JSON.parse(body) as { filename: string; data: string };

            // Derive folder name from saved user
            let folderName = 'unknown';
            try {
              const user = JSON.parse(fs.readFileSync(USER_JSON, 'utf-8'));
              if (user?.name) folderName = user.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            } catch {}

            const uploadDir = path.join(IMAGES_DIR, folderName);
            fs.mkdirSync(uploadDir, { recursive: true });

            const base64 = data.replace(/^data:[^;]+;base64,/, '');
            const ext = path.extname(filename) || '.jpg';
            const safeName = `${Date.now()}${ext}`;
            const filePath = path.join(uploadDir, safeName);
            fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));

            res.end(JSON.stringify({ ok: true, path: `data/images/${folderName}/${safeName}` }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
      });
    },
  };
}

function identifyApiPlugin(apiKey: string, appId: string) {
  return {
    name: 'identify-api',
    configureServer(server: { middlewares: { use: (p: string, h: (req: any, res: any) => void) => void } }) {
      server.middlewares.use('/api/identify', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('{"error":"Method not allowed"}');
          return;
        }

        if (!apiKey || !appId) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'API_KEY and APP_ID must be set in your .env file.' }));
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const { imageData, imagePath } = JSON.parse(Buffer.concat(chunks).toString()) as {
              imageData: string;
              imagePath: string;
            };

            const deepseekRes = await fetch('https://qianfan.baidubce.com/v2/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'appid': appId,
              },
              body: JSON.stringify({
                model: 'qwen3-vl-235b-a22b-thinking',
                messages: [
                  {
                    role: 'system',
                    content:
                      'You are a botanist and plant care expert. Identify plants from images and respond ONLY with valid JSON.',
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
                max_tokens: 1500,
              }),
            });

            if (!deepseekRes.ok) {
              const errText = await deepseekRes.text();
              res.statusCode = 502;
              res.end(JSON.stringify({ error: `DeepSeek ${deepseekRes.status}: ${errText}` }));
              return;
            }

            const completion = (await deepseekRes.json()) as {
              choices: { message: { content: string } }[];
            };
            const parsed = JSON.parse(completion.choices[0].message.content);

            const id = Date.now().toString();
            const result = {
              id,
              scannedAt: new Date().toISOString(),
              plant: parsed.plant ?? 'Unknown Plant',
              scientificName: parsed.scientificName ?? '',
              description: parsed.description ?? '',
              imageUrl: imagePath,
              quickFacts: parsed.quickFacts ?? { difficulty: '', light: '', water: '', humidity: '' },
              taskGroups: Array.isArray(parsed.taskGroups) ? parsed.taskGroups : [],
              tips: Array.isArray(parsed.tips) ? parsed.tips : [],
            };

            // Save identification result as JSON alongside the image
            const jsonRelPath = imagePath.replace(/\.[^.]+$/, '.json');
            const absJsonPath = path.resolve(__dirname, jsonRelPath);
            fs.mkdirSync(path.dirname(absJsonPath), { recursive: true });
            fs.writeFileSync(absJsonPath, JSON.stringify(result, null, 2));

            res.end(JSON.stringify({ ...result, jsonPath: jsonRelPath }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), userApiPlugin(), uploadApiPlugin(), identifyApiPlugin(env.API_KEY, env.APP_ID)],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
