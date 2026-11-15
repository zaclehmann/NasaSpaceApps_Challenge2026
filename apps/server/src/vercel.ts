// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The HTTP adapter: turns a Node request into a router call and writes the JSON answer. Bundled with everything
// it imports into api/_server.mjs (npm run build:api), which the Vercel function api/router.js and the local
// dev server (scripts/dev-api.mjs) both load. The path comes from the `path` query parameter that the
// vercel.json rewrite adds (/api/state -> /api/router?path=state), or from the URL itself.
import { MissingEnvError } from "./env";
import { serverCtx } from "./index";
import { MAX_BODY_BYTES, route } from "./router";

/** The parts of Node's IncomingMessage and ServerResponse this adapter uses. */
interface Req {
  method?: string;
  url?: string;
  on(event: "data", cb: (chunk: Uint8Array) => void): void;
  on(event: "end" | "error", cb: (err?: unknown) => void): void;
}
interface Res {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

function readBody(req: Req): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let size = 0;
    let over = false;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) over = true;
      else chunks.push(c);
    });
    req.on("end", () => {
      if (over) return resolve(null);
      const all = new Uint8Array(size);
      let o = 0;
      for (const c of chunks) {
        all.set(c, o);
        o += c.length;
      }
      resolve(new TextDecoder().decode(all));
    });
    req.on("error", reject);
  });
}

function send(res: Res, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export default async function handler(req: Req, res: Res) {
  const url = new URL(req.url ?? "/", "http://local");
  const query = Object.fromEntries(url.searchParams);
  const path = query.path ?? url.pathname.replace(/^\/api\/?/, "");
  delete query.path;
  const method = (req.method ?? "GET").toUpperCase();
  const raw = method === "POST" ? await readBody(req) : undefined;
  if (raw === null) return send(res, 413, { error: `Request body over ${MAX_BODY_BYTES / 1024} KB.` });
  let ctx;
  try {
    ctx = serverCtx();
  } catch (err) {
    if (err instanceof MissingEnvError) {
      console.error(err.message);
      // Health still answers, so the web app can fall back to local mode.
      if (path.replace(/\/+$/, "") === "health") return send(res, 200, { ok: true, db: "down", time: new Date().toISOString() });
      return send(res, 503, { error: "The onboard server is not configured." });
    }
    throw err;
  }
  const r = await route(ctx, method, path, query, raw ?? undefined);
  send(res, r.status, r.body);
}
