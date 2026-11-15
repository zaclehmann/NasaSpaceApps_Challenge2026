// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Build check: the Supabase key is server-only, so nothing about it may reach the web app's built files.
// Fails the build if "SUPABASE", "sb_secret_" or "service_role" appears anywhere in apps/web/dist.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../apps/web/dist", import.meta.url));
const BANNED = [/SUPABASE/, /sb_secret_/, /service_role/];

async function* files(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* files(p);
    else yield p;
  }
}

const hits = [];
for await (const f of files(DIST)) {
  const text = await readFile(f, "utf8").catch(() => "");
  for (const re of BANNED) if (re.test(text)) hits.push(`${f.slice(DIST.length + 1)} contains ${re.source}`);
}
if (hits.length) {
  console.error(`Web bundle check failed. Server-only Supabase names reached the browser build:\n  ${hits.join("\n  ")}`);
  process.exit(1);
}
console.log("Web bundle check: no Supabase key or names in apps/web/dist.");
