// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Downloads the May 2024 solar storm records from NASA's DONKI space weather database (no API key needed)
// and writes a trimmed copy to packages/shared/data/donki-2024-05.json. Run once by hand: npm run fetch:donki.
// The app never calls DONKI at runtime, so it works offline. Node built-ins only (Node 20+ fetch).
// Sources, tried in order; the JSON records which one answered. On 15 Nov 2026 the kauai host timed out from
// some networks and the api.nasa.gov gateway returned 404 for flares, so the main CCMC host comes first.
// The gateway uses the public DEMO_KEY, or NASA_API_KEY if set; the key is never written to the file.
import { setDefaultResultOrder } from "node:dns";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Some networks resolve the CCMC hosts to IPv6 but can't route it, and Node then fails at once. Prefer IPv4.
setDefaultResultOrder("ipv4first");

const RANGE = "startDate=2024-05-08&endDate=2024-05-14";
const KEY = process.env.NASA_API_KEY || "DEMO_KEY";
const SOURCES = [
  { name: "CCMC DONKI web service", base: "https://ccmc.gsfc.nasa.gov/DONKI/WS/get", query: RANGE },
  { name: "CCMC DONKI web service (kauai host)", base: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get", query: RANGE },
  { name: "NASA API gateway to DONKI", base: "https://api.nasa.gov/DONKI", query: `${RANGE}&api_key=${KEY}` },
];
const urls = (s, q = s.query) => ({ sep: `${s.base}/SEP?${q}`, flr: `${s.base}/FLR?${q}`, cme: `${s.base}/CME?${q}` });
const OUT = fileURLToPath(new URL("../packages/shared/data/donki-2024-05.json", import.meta.url));

async function get(name, url) {
  const shown = url.replace(/api_key=[^&]+/, "api_key=…");
  const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status} from ${shown}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`${name}: expected a JSON array from ${shown}`);
  return data;
}

const linked = (e) => (e.linkedEvents ?? []).map((l) => l.activityID).filter(Boolean);

async function download() {
  const errors = [];
  for (const s of SOURCES) {
    const u = urls(s);
    try {
      const [sep, flr, cme] = await Promise.all([get("SEP", u.sep), get("FLR", u.flr), get("CME", u.cme)]);
      return { s, sep, flr, cme };
    } catch (err) {
      errors.push(`${s.name}: ${err.cause?.code ?? err.message}`);
      console.error(`${s.name} failed (${err.cause?.code ?? err.message}), trying the next source.`);
    }
  }
  throw new Error(errors.join("; "));
}

try {
  const { s, sep, flr, cme } = await download();
  const keyless = urls(s, RANGE);
  const out = {
    source: {
      urls: [keyless.sep, keyless.flr, keyless.cme],
      via: s.name,
      fetchedAt: new Date().toISOString(),
      attribution: "NASA Community Coordinated Modeling Center, DONKI",
    },
    sep: sep.map((e) => ({ sepID: e.sepID, eventTime: e.eventTime, instruments: (e.instruments ?? []).map((i) => i.displayName), linkedEvents: linked(e), link: e.link })),
    flr: flr.map((e) => ({ flrID: e.flrID, beginTime: e.beginTime, peakTime: e.peakTime, classType: e.classType, link: e.link })),
    cme: cme.map((e) => ({ activityID: e.activityID, startTime: e.startTime, link: e.link })),
  };
  await writeFile(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${OUT}: ${out.sep.length} SEP, ${out.flr.length} flares, ${out.cme.length} CMEs.`);
} catch (err) {
  console.error(`DONKI download failed: ${err.message}`);
  process.exit(1);
}
