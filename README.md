<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5c7be975-0be1-420c-b06a-f826e8897c25

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `API_KEY` and `APP_ID` in [.env.local](.env.local) to your Qianfan credentials. Optionally set `QIANFAN_MODEL`; the default is `qwen3-vl-235b-a22b-instruct`.
3. Run the app:
   `npm start`

   The app is served at http://localhost:3000.

## Available Scripts

- `npm start` — build the app and serve the production bundle at http://localhost:3000 (includes the `/api/*` backend endpoints)
- `npm run dev` — start the Vite dev server on port 3000 with hot module replacement
- `npm run build` — build the production bundle to `dist/`
- `npm run preview` — serve an existing production build on port 3000 (run `npm run build` first)
- `npm run lint` — type-check with `tsc --noEmit`
- `npm run clean` — remove the `dist/` directory

## Production Environment

The deployed server must have plant-identification secrets configured as runtime
environment variables. Local `.env` files are ignored by git and are not deployed.

Set either:

- `API_KEY` and `APP_ID` for Qianfan, plus optional `QIANFAN_MODEL`
- `GEMINI_API_KEY` for Gemini fallback, plus optional `GEMINI_MODEL`

After changing production environment variables, restart or redeploy the site so
the API server picks them up.
