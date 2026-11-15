// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Smoke test for the API: health, create a session, post a blood pressure reading, read /state, check the reading
// is there and Caution, then reset the session (deletes its rows). Node built-ins only; it never sees a secret.
// Usage: node scripts/smoke-api.mjs [base-url]   (default http://localhost:3001, the local API from npm run dev:api)
//        node scripts/smoke-api.mjs https://<preview>.vercel.app
import { randomUUID } from "node:crypto";
import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");
const base = (process.argv[2] ?? "http://localhost:3001").replace(/\/+$/, "");
const session = randomUUID();
let failed = false;

async function call(method, path, body) {
  const res = await fetch(`${base}/api/${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${method} /api/${path}: HTTP ${res.status}, not JSON (is the API deployed at this address?)`);
  }
  if (!res.ok) throw new Error(`${method} /api/${path}: HTTP ${res.status} ${json.error ?? ""}`);
  return json;
}

function step(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed = true;
}

console.log(`Smoke test against ${base}`);
try {
  const health = await call("GET", "health");
  step("GET /api/health", health.ok === true && health.db === "up", `db: ${health.db}`);
  const s = await call("POST", "session", { id: session });
  step("POST /api/session", s.id === session, `scenario ${s.scenario}`);
  const r = await call("POST", "readings", { session, astronaut: "mira", indicator: "bp", value: 150, value2: 95, pulse: 72, device: "cuff" });
  step("POST /api/readings (blood pressure 150/95)", r.status === "caution", `status ${r.status}, alert ${r.alert ? r.alert.status : "none"}`);
  const st = await call("GET", `state?session=${session}&astronaut=tomas`);
  const stored = st.rows.readings.some((x) => x.indicator === "bp" && x.value === 150 && x.value2 === 95);
  step("GET /api/state has the reading", stored, `${st.rows.readings.length} stored reading(s), mira bp ${st.view.astronauts.mira.indicators.bp.status}`);
  const other = await call("GET", `state?session=${randomUUID()}`).catch((e) => e);
  step("an unknown session is refused", other instanceof Error && /404/.test(other.message));
} catch (err) {
  step("request", false, err.message);
} finally {
  await call("POST", "demo", { session, reset: true }).then(
    () => console.log("Cleaned up the test session."),
    () => console.log("Could not clean up the test session (it holds one test reading)."),
  );
}
process.exit(failed ? 1 : 0);
