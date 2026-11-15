// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Server configuration from the environment (.env.local locally, Vercel environment variables when deployed).
// Server-side only: never imported by apps/web. Errors name the missing variable and never print a value.

export interface ServerEnv {
  supabaseUrl: string;
  supabaseKey: string;
}

export class MissingEnvError extends Error {}

export function readEnv(env: Record<string, string | undefined> = process.env): ServerEnv {
  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((name) => !env[name]?.trim());
  if (missing.length) throw new MissingEnvError(`Missing ${missing.join(" and ")}. Set it in .env.local (local) or in Vercel environment variables.`);
  return { supabaseUrl: env.SUPABASE_URL!.trim(), supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY!.trim() };
}
