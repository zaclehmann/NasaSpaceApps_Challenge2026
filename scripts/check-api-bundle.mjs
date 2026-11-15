// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Fails if the committed API bundle (api/_server.mjs) doesn't match a fresh build of the server code, so a stale
// bundle can never be deployed. Builds into a temporary folder and compares byte for byte. Part of npm test.
// Fix a failure with: npm run build:api, then commit api/_server.mjs.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = mkdtempSync(join(tmpdir(), "mv-api-bundle-"));
try {
  execFileSync("npx", ["vite", "build", "--config", "apps/server/bundle.config.ts"], { cwd: root, env: { ...process.env, API_BUNDLE_OUT: out }, stdio: "pipe" });
  const fresh = readFileSync(join(out, "_server.mjs"));
  const committed = readFileSync(join(root, "api", "_server.mjs"));
  if (!fresh.equals(committed)) {
    console.error("API bundle check failed: api/_server.mjs is out of date. Run npm run build:api and commit api/_server.mjs.");
    process.exit(1);
  }
  console.log("API bundle check: api/_server.mjs matches a fresh build.");
} finally {
  rmSync(out, { recursive: true, force: true });
}
