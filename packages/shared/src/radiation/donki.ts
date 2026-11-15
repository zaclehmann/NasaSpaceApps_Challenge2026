// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// NASA DONKI records for the May 2024 solar storm (packages/shared/data/donki-2024-05.json, downloaded once by
// scripts/fetch-donki.mjs). This file checks the data and picks the event sequence the solar storm scenario
// replays. Everything here comes from the data: no event time is written in code.
import raw from "../../data/donki-2024-05.json";

export interface DonkiSep {
  sepID: string;
  eventTime: string;
  instruments: string[];
  linkedEvents: string[];
  link: string;
}
export interface DonkiFlare {
  flrID: string;
  beginTime: string;
  peakTime: string | null;
  classType: string;
  link: string;
}
export interface DonkiCme {
  activityID: string;
  startTime: string;
  link: string;
}
export interface DonkiData {
  source: { urls: string[]; fetchedAt: string; attribution: string; via?: string };
  sep: DonkiSep[];
  flr: DonkiFlare[];
  cme: DonkiCme[];
}

/** One event in the replayed sequence. `role` marks the two particle arrivals the dose model follows. */
export interface SolarEvent {
  id: string;
  kind: "flare" | "cme" | "sep";
  role: "trigger" | "onset" | "peak";
  /** Full label, for the event list. */
  label: string;
  /** Short chart label. */
  short: string;
  /** Real UTC time, ISO as DONKI gives it, and in milliseconds. */
  time: string;
  ms: number;
  link: string;
  detail: string;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isTime = (v: unknown) => typeof v === "string" && !Number.isNaN(Date.parse(v));

function need(cond: boolean, what: string): asserts cond {
  if (!cond) throw new Error(`DONKI data is malformed: ${what}`);
}

/** Checks the shape of the DONKI file and returns it typed. Throws a clear error naming the first problem. */
export function parseDonki(data: unknown): DonkiData {
  need(isObj(data), "the file is not a JSON object");
  need(isObj(data.source) && Array.isArray(data.source.urls) && typeof data.source.attribution === "string", "source.urls or source.attribution is missing");
  need(Array.isArray(data.sep) && Array.isArray(data.flr) && Array.isArray(data.cme), "sep, flr or cme is not a list");
  data.sep.forEach((e, i) => {
    need(isObj(e), `sep[${i}] is not an object`);
    need(typeof e.sepID === "string", `sep[${i}].sepID is missing`);
    need(isTime(e.eventTime), `sep[${i}].eventTime is missing or not a time`);
    need(Array.isArray(e.instruments) && e.instruments.every((x) => typeof x === "string"), `sep[${i}].instruments is missing`);
    need(Array.isArray(e.linkedEvents), `sep[${i}].linkedEvents is missing`);
    need(typeof e.link === "string", `sep[${i}].link is missing`);
  });
  data.flr.forEach((e, i) => {
    need(isObj(e), `flr[${i}] is not an object`);
    need(typeof e.flrID === "string" && isTime(e.beginTime), `flr[${i}].flrID or beginTime is missing`);
    need(typeof e.classType === "string" && typeof e.link === "string", `flr[${i}].classType or link is missing`);
  });
  data.cme.forEach((e, i) => {
    need(isObj(e), `cme[${i}] is not an object`);
    need(typeof e.activityID === "string" && isTime(e.startTime) && typeof e.link === "string", `cme[${i}].activityID, startTime or link is missing`);
  });
  return data as unknown as DonkiData;
}

const ms = (t: string) => Date.parse(t);

/** The GOES particle event on `day` (YYYY-MM-DD) whose instrument reads `energy` (">10 MeV" or ">100 MeV"). */
function goesSep(d: DonkiData, day: string, energy: string): DonkiSep {
  const e = d.sep.find((s) => s.eventTime.startsWith(day) && s.instruments.some((i) => i.includes("GOES") && i.includes(energy)));
  if (!e) throw new Error(`DONKI data has no GOES ${energy} particle event on ${day}`);
  return e;
}

/** The latest linked flare and CME that began before the particle event, looked up in the flare and CME lists. */
function triggers(d: DonkiData, sep: DonkiSep): SolarEvent[] {
  const before = (t: string) => ms(t) < ms(sep.eventTime);
  const flares = d.flr.filter((f) => sep.linkedEvents.includes(f.flrID) && before(f.beginTime)).sort((a, b) => ms(a.beginTime) - ms(b.beginTime));
  const cmes = d.cme.filter((c) => sep.linkedEvents.includes(c.activityID) && before(c.startTime)).sort((a, b) => ms(a.startTime) - ms(b.startTime));
  const out: SolarEvent[] = [];
  const f = flares.at(-1);
  if (f) out.push({ id: f.flrID, kind: "flare", role: "trigger", label: `${f.classType} flare`, short: "Flare", time: f.beginTime, ms: ms(f.beginTime), link: f.link, detail: `Class ${f.classType}` });
  const c = cmes.at(-1);
  if (c) out.push({ id: c.activityID, kind: "cme", role: "trigger", label: "Coronal mass ejection launched", short: "CME", time: c.startTime, ms: ms(c.startTime), link: c.link, detail: "CME" });
  return out;
}

/**
 * The replayed sequence, in time order: for each GOES particle arrival (>10 MeV on 10 May, >100 MeV on 11 May),
 * the flare and CME that triggered it, then the arrival itself.
 */
export function solarSequence(d: DonkiData): SolarEvent[] {
  const onset = goesSep(d, "2024-05-10", ">10 MeV");
  const peak = goesSep(d, "2024-05-11", ">100 MeV");
  const sepEvent = (s: DonkiSep, role: "onset" | "peak", energy: string): SolarEvent => ({
    id: s.sepID,
    kind: "sep",
    role,
    label: `Particles above ${energy} MeV arrive (GOES)`,
    short: `>${energy} MeV`,
    time: s.eventTime,
    ms: ms(s.eventTime),
    link: s.link,
    detail: s.instruments.join(", "),
  });
  const all = [...triggers(d, onset), sepEvent(onset, "onset", "10"), ...triggers(d, peak), sepEvent(peak, "peak", "100")];
  const seen = new Set<string>();
  return all.filter((e) => !seen.has(e.id) && seen.add(e.id)).sort((a, b) => a.ms - b.ms);
}

export const DONKI: DonkiData = parseDonki(raw);
export const SOLAR_SEQUENCE: SolarEvent[] = solarSequence(DONKI);
/** The DONKI web service pages the data came from, for References. */
export const DONKI_SOURCE = DONKI.source;
