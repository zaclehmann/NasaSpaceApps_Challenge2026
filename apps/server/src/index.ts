// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The server's entry for the Vercel function: one Supabase-backed context, created on first use.
import { readEnv } from "./env";
import type { Ctx } from "./handlers";
import { SupabaseStore } from "./supabaseStore";

export { route, MAX_BODY_BYTES, type ApiResult } from "./router";
export type { Ctx } from "./handlers";

let ctx: Ctx | undefined;

/** The production context. Throws MissingEnvError (naming the variable) if the Supabase settings are missing. */
export function serverCtx(): Ctx {
  ctx ??= { store: new SupabaseStore(readEnv()), now: () => new Date().toISOString() };
  return ctx;
}
