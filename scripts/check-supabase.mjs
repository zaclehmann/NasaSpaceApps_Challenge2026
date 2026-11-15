// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Checks that the Supabase project in .env.local can be reached with the service role key.
// Run: npm run check:supabase. Uses Node built-ins only (Node 20+ fetch). Never prints the key or the full URL.

const REQUIRED = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = REQUIRED.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Missing ${missing.join(" and ")}. Copy .env.example to .env.local and fill in the values from Supabase > Project Settings > API.`);
  process.exit(1);
}

const url = process.env.SUPABASE_URL.trim().replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();

let host;
try {
  host = new URL(url).host;
} catch {
  console.error("SUPABASE_URL is not a valid URL. It should look like https://<project-ref>.supabase.co");
  process.exit(1);
}
// Only the start of the project ref is shown, so a log or screenshot never carries the full address.
const label = host.endsWith(".supabase.co") ? `${host.split(".")[0].slice(0, 4)}….supabase.co` : "the configured host";

try {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(5000),
  });
  if (res.ok) {
    console.log(`Supabase reachable (HTTP ${res.status}) at ${label}.`);
  } else if (res.status === 401 || res.status === 403) {
    console.error(`Supabase answered at ${label} but refused the key (HTTP ${res.status}). Check SUPABASE_SERVICE_ROLE_KEY is the service_role or sb_secret_ key.`);
    process.exit(1);
  } else {
    console.error(`Supabase answered at ${label} with HTTP ${res.status}.`);
    process.exit(1);
  }
} catch (err) {
  const reason = err?.name === "TimeoutError" ? "no answer within 5 seconds" : (err?.cause?.code ?? err?.message ?? "unknown error");
  console.error(`Supabase not reachable at ${label}: ${reason}.`);
  process.exit(1);
}
