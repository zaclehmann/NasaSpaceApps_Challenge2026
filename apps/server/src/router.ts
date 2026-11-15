// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Maps an API request (method, path under /api, query, raw body) to a handler and turns the result or error into a
// status and a JSON body. No HTTP server objects here: the Vercel function (api/router.ts) and tests both call it.
import { ApiError } from "./errors";
import * as h from "./handlers";
import type { Ctx } from "./handlers";

/** Request bodies larger than this are refused. */
export const MAX_BODY_BYTES = 10 * 1024;

export interface ApiResult {
  status: number;
  body: unknown;
}

type Route = { method: "GET" | "POST"; pattern: RegExp; run: (ctx: Ctx, m: RegExpMatchArray, query: Record<string, string>, body: unknown) => Promise<unknown> };

const ROUTES: Route[] = [
  { method: "GET", pattern: /^health$/, run: (ctx) => h.health(ctx) },
  { method: "POST", pattern: /^session$/, run: (ctx, _m, _q, body) => h.createSession(ctx, body) },
  { method: "GET", pattern: /^state$/, run: (ctx, _m, q) => h.getState(ctx, q) },
  { method: "GET", pattern: /^readings$/, run: (ctx, _m, q) => h.getReadings(ctx, q) },
  { method: "POST", pattern: /^readings$/, run: (ctx, _m, _q, body) => h.postReading(ctx, body) },
  { method: "POST", pattern: /^symptoms$/, run: (ctx, _m, _q, body) => h.postSymptom(ctx, body) },
  { method: "POST", pattern: /^symptoms\/([\w-]{1,40})\/resolve$/, run: (ctx, m, _q, body) => h.resolveSymptom(ctx, m[1], body) },
  { method: "POST", pattern: /^routine\/complete$/, run: (ctx, _m, _q, body) => h.completeTask(ctx, body) },
  { method: "POST", pattern: /^routine\/postpone$/, run: (ctx, _m, _q, body) => h.postponeTask(ctx, body) },
  { method: "POST", pattern: /^alerts\/([\w.-]{1,80})\/acknowledge$/, run: (ctx, m, _q, body) => h.acknowledgeAlert(ctx, m[1], body) },
  { method: "POST", pattern: /^alerts\/([\w.-]{1,80})\/actions$/, run: (ctx, m, _q, body) => h.logAlertAction(ctx, m[1], body) },
  { method: "POST", pattern: /^reports$/, run: (ctx, _m, _q, body) => h.queueReport(ctx, body) },
  { method: "POST", pattern: /^demo$/, run: (ctx, _m, _q, body) => h.demo(ctx, body) },
];

export async function route(ctx: Ctx, method: string, path: string, query: Record<string, string>, rawBody: string | undefined): Promise<ApiResult> {
  const clean = path.replace(/^\/+/, "").replace(/^api\//, "").replace(/\/+$/, "");
  try {
    const candidates = ROUTES.filter((r) => r.pattern.test(clean));
    if (!candidates.length) return { status: 404, body: { error: "No such API endpoint." } };
    const r = candidates.find((c) => c.method === method);
    if (!r) return { status: 405, body: { error: `Use ${candidates.map((c) => c.method).join(" or ")} for this endpoint.` } };
    let body: unknown;
    if (method === "POST") {
      const text = rawBody ?? "";
      if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return { status: 413, body: { error: `Request body over ${MAX_BODY_BYTES / 1024} KB.` } };
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        return { status: 400, body: { error: "Request body is not valid JSON." } };
      }
    }
    return { status: 200, body: await r.run(ctx, clean.match(r.pattern)!, query, body) };
  } catch (err) {
    if (err instanceof ApiError) return { status: err.status, body: { error: err.message } };
    // Details stay in the server log; the client gets a generic message.
    console.error("API error", method, clean, err instanceof Error ? err.message : err);
    return { status: 500, body: { error: "Something went wrong on the server." } };
  }
}
