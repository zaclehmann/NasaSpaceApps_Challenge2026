// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Local API server for development without the Vercel CLI: serves the same bundle as the Vercel function
// (api/_server.mjs) on http://localhost:3001. Vite's dev server forwards /api there (apps/web/vite.config.ts).
// Run: npm run dev:api (reads .env.local). Node built-ins only.
import { createServer } from "node:http";
import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");
const { default: handler } = await import("../api/_server.mjs");
const PORT = Number(process.env.API_PORT ?? 3001);

createServer((req, res) => {
  handler(req, res).catch((err) => {
    console.error(err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Something went wrong on the server." }));
  });
}).listen(PORT, () => console.log(`MissionVitals API on http://localhost:${PORT}/api (local, from api/_server.mjs)`));
