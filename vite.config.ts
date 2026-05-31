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

function identifyApiPlugin(apiKey: string) {
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

        if (!apiKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'DEEPSEEK_API_KEY is not set. Add it to your .env file.' }));
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

            const deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: 'deepseek-chat',
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
                        text: 'Identify this plant. Respond ONLY with JSON matching this shape exactly:\n{"plant":"Common Name (Scientific Name)","description":"One sentence about this plant and its origin.","careTasks":["task 1","task 2","task 3","task 4","task 5","task 6"]}\nProvide exactly 6 specific, actionable care tasks the owner should do regularly.',
                      },
                    ],
                  },
                ],
                response_format: { type: 'json_object' },
                max_tokens: 800,
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

            res.end(
              JSON.stringify({
                plant: parsed.plant ?? 'Unknown Plant',
                description: parsed.description ?? '',
                imageUrl: imagePath,
                careTasks: Array.isArray(parsed.careTasks) ? parsed.careTasks : [],
              }),
            );
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
    plugins: [react(), tailwindcss(), userApiPlugin(), uploadApiPlugin(), identifyApiPlugin(env.DEEPSEEK_API_KEY)],
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
