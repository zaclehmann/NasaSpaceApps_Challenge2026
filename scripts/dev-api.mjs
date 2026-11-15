// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Local API server for development without the Vercel CLI: serves the same bundle as the Vercel function
// (api/_server.mjs) on http://localhost:3001. Vite's dev server forwards /api there (apps/web/vite.config.ts).
// Run: npm run dev:api (reads .env.local). Node built-ins only.
// MV_DEBUG_DELAY_MS (local only, never read by the Vercel function) holds every request that long before handling
// it, like a slow link to the server, to reproduce actions that happen while a save is still in flight.
// MV_DEBUG_DELAY_WRITES_ONLY=1 delays only POST requests (saves), so the page still loads in server mode.
import { createServer } from "node:http";
import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");
const { default: handler } = await import("../api/_server.mjs");
const PORT = Number(process.env.API_PORT ?? 3001);
const DELAY_MS = Math.max(0, Number(process.env.MV_DEBUG_DELAY_MS ?? 0) || 0);
const WRITES_ONLY = process.env.MV_DEBUG_DELAY_WRITES_ONLY === "1";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

createServer((req, res) => {
  const delay = DELAY_MS && (!WRITES_ONLY || req.method === "POST") ? DELAY_MS : 0;
  (delay ? wait(delay) : Promise.resolve()).then(() => handler(req, res)).catch((err) => {
    console.error(err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Something went wrong on the server." }));
  });
}).listen(PORT, () => console.log(`MissionVitals API on http://localhost:${PORT}/api (local, from api/_server.mjs)${DELAY_MS ? `, every ${WRITES_ONLY ? "POST " : ""}request delayed ${DELAY_MS} ms` : ""}`));
