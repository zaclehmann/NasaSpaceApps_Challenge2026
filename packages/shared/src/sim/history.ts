// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The seeded starting state: 30 days of entered measurements per astronaut, this morning's checks, the routine
// tasks those checks completed, each scenario's change to entered data, and a little resolved symptom history.
// Pure: the same scenario always gives the same result. What the astronaut does afterwards is state, kept elsewhere.
import { DAY, startOfDay } from "../time";
import type { Symptom } from "../symptoms";
import type { Reading } from "../types";
import { BASE, CREW, MET_AT_LOAD, MIN } from "./crew";
import { SEED, mulberry32, strHash } from "./random";
import type { SimScenario } from "./live";

/** Entered readings per astronaut and indicator, oldest first. */
export type EnteredReadings = Record<string, Record<string, Reading[]>>;
/** Routine completions per astronaut: task id to MET. */
export type Completions = Record<string, Record<string, number>>;

export function seedEntered(s: SimScenario): { manual: EnteredReadings; completions: Completions } {
  const manual: EnteredReadings = {};
  const completions: Completions = {};
  const today = startOfDay(MET_AT_LOAD);
  for (const a of CREW) {
    const b = BASE[a.id];
    const rng = mulberry32(SEED ^ strHash(a.id));
    const jitter = (spread: number) => (rng() * 2 - 1) * spread;
    const m: Record<string, Reading[]> = { bp: [], temp: [], glucose: [], sleep: [], exercise: [], mood: [] };
    for (let d = 29; d >= 1; d--) {
      const day = today - d * DAY;
      // Tomas's blood pressure has been creeping up over the last three days (Watch).
      const creep = a.id === "tomas" && d <= 3 ? (4 - d) * 2 : 0;
      const sys = b.bp[0] + creep + (creep ? 0 : jitter(3));
      const dia = b.bp[1] + creep / 2 + (creep ? 0 : jitter(2));
      m.bp.push({ t: day + 7 * 3600 + Math.floor(rng() * 8) * MIN, value: Math.round(sys), value2: Math.round(dia), pulse: Math.round(b.hr + jitter(4)), device: "cuff" });
      m.bp.push({ t: day + 21 * 3600 + Math.floor(rng() * 8) * MIN, value: Math.round(sys + 1 + (creep ? 0 : jitter(3))), value2: Math.round(dia + (creep ? 1 : jitter(2))), pulse: Math.round(b.hr + 3 + jitter(4)), device: "cuff" });
      m.temp.push({ t: day + 7 * 3600 + (5 + Math.floor(rng() * 4)) * MIN, value: Math.round((b.temp + jitter(0.12)) * 10) / 10, device: "thermometer" });
      m.glucose.push({ t: day + 7 * 3600 + (10 + Math.floor(rng() * 5)) * MIN, value: Math.round(b.glucose + jitter(5)), timing: "fasting", device: "glucometer" });
      m.sleep.push({ t: day + 7 * 3600 + (15 + Math.floor(rng() * 5)) * MIN, value: Math.round((b.sleep + jitter(0.5)) * 10) / 10, device: "self" });
      // Daily exercise minutes from the shirt, confirmed by the astronaut. About one day in ten falls short.
      const short = rng() < 0.1;
      m.exercise.push({ t: day + 16 * 3600 + (40 + Math.floor(rng() * 20)) * MIN, value: Math.round(short ? 100 + rng() * 15 : b.exercise + jitter(10)), device: "shirt" });
      const moodRoll = rng();
      m.mood.push({ t: day + 14 * 3600 + Math.floor(20 + rng() * 30) * MIN, value: moodRoll < 0.15 ? 3 : moodRoll > 0.85 ? 5 : b.mood, stress: moodRoll < 0.15 ? 3 : 2, device: "self" });
    }
    const [bpMin, tempMin, gluMin, sleepMin] = b.morning;
    const todayBp: [number, number] = a.id === "tomas" ? [131, 84] : b.bp;
    m.bp.push({ t: today + bpMin * MIN, value: todayBp[0], value2: todayBp[1], pulse: b.hr + 2, device: "cuff" });
    m.temp.push({ t: today + tempMin * MIN, value: b.temp, device: "thermometer" });
    m.glucose.push({ t: today + gluMin * MIN, value: b.glucose, timing: "fasting", device: "glucometer" });
    m.sleep.push({ t: today + sleepMin * MIN, value: b.sleep, device: "self" });
    manual[a.id] = m;
    completions[a.id] = { "bp-am": today + bpMin * MIN, "temp-am": today + tempMin * MIN, "glucose-am": today + gluMin * MIN, "sleep-review": today + sleepMin * MIN };
  }

  // Scenarios that change entered data.
  const t = manual[s.target];
  if (s.scenario === "hr-exercise") {
    // Today's session ended about 20 minutes ago; heart rate has not come back down.
    const at = s.anchor - 22 * MIN;
    t.exercise.push({ t: at, value: 124, device: "shirt" });
    completions[s.target].exercise = at;
  }
  if (s.scenario === "high-bp") {
    const last = t.bp[t.bp.length - 1];
    last.value = 148;
    last.value2 = 92;
  }
  if (s.scenario === "mood-falling") {
    const fall = [5, 5, 4, 4, 4, 3];
    const n = t.mood.length;
    fall.forEach((v, i) => {
      t.mood[n - fall.length + i].value = v;
      t.mood[n - fall.length + i].stress = v <= 3 ? 4 : 2;
    });
    const at = today + 14 * 3600 + 20 * MIN;
    t.mood.push({ t: at, value: 3, stress: 4, tags: ["Tired", "Unfocused"], device: "self" });
    completions[s.target].mood = at;
  }
  return { manual, completions };
}

/** A little resolved history per astronaut, so the symptom log has a past. Nothing active: scenarios stay as they are. */
export function seedSymptoms(today: number = startOfDay(MET_AT_LOAD)): Symptom[] {
  const h = 3600;
  const rows: [string, string, Symptom["layer"], string, number, number, number, string?][] = [
    // astronaut, part, layer, kind, severity, started (days ago), resolved (days ago), note
    ["hana", "m-lower-back", "muscles", "Pain", 3, 9, 6, "After a long treadmill session."],
    ["hana", "o-head", "organs", "Headache", 4, 4, 3],
    ["mira", "s-knee-l", "skeleton", "Pain", 2, 12, 10, "Knocked it on a hatch."],
    ["tomas", "o-ears", "organs", "Dizziness", 3, 20, 19],
    ["tomas", "m-neck", "muscles", "Stiffness", 2, 5, 4],
  ];
  return rows.map(([astronautId, partId, layer, kind, severity, started, resolved, note], i) => {
    const startedAt = today - started * DAY + 9 * h;
    return { id: `sym-seed-${i}`, astronautId, partId, layer, kind, severity, startedAt, t: startedAt + h, affectsWork: false, resolvedAt: today - resolved * DAY + 18 * h, note };
  });
}
