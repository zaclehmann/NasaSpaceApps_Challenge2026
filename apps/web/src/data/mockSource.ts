// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Seeded in-memory mock. Same seed, same data on every load. All data is simulated.
import {
  DAY,
  INDICATORS,
  INDICATOR_KEYS,
  MISSION_SETTINGS,
  POSTPONE_MIN,
  ROUTINE,
  WINDOW_SEC,
  evaluate,
  formatClock,
  formatValue,
  routineContext,
  routineEntries,
  ruleText,
  sampleStepSec,
  startOfDay,
  type Alert,
  type AlertActionKind,
  type Astronaut,
  type ChartWindow,
  type Evaluation,
  type IndicatorKey,
  type Mission,
  type MissionSetting,
  type MissionSettingId,
  type Reading,
  type Report,
  type RoutineSummary,
  type ScenarioId,
  type NewSymptom,
  type Symptom,
} from "@missionvitals/shared";
import type { DataSource, NewReport } from "./DataSource";

const SEED = 20261114;
/** MET at load: 141d 14:33. */
export const MET_AT_LOAD = 141 * DAY + 14 * 3600 + 33 * 60;
const TICK_SEC = 5;
/** An out-of-range value must last this long before an alert fires, and stay clear this long before it ends. */
const SUSTAIN_SEC = 60;
const MIN = 60;

const CREW: Astronaut[] = [
  { id: "hana", name: "Hana Park", role: "Flight engineer", isCmo: false },
  { id: "mira", name: "Mira Okafor", role: "Commander", isCmo: false },
  { id: "tomas", name: "Tomas Lindqvist", role: "Crew medical officer", isCmo: true },
];

interface Baseline {
  hr: number;
  spo2: number;
  temp: number;
  bp: [number, number];
  glucose: number;
  sleep: number;
  mood: number;
  /** Clock minutes of this morning's checks: blood pressure, temperature, glucose, sleep. */
  morning: [number, number, number, number];
  /** Usual daily exercise, in minutes. */
  exercise: number;
  streak: number;
  weekBase: number;
}

const BASE: Record<string, Baseline> = {
  hana: { hr: 68, spo2: 98, temp: 36.7, bp: [118, 76], glucose: 96, sleep: 7.2, mood: 4, morning: [422, 427, 430, 432], exercise: 132, streak: 12, weekBase: 41 },
  mira: { hr: 61, spo2: 97.6, temp: 36.6, bp: [112, 72], glucose: 90, sleep: 6.9, mood: 4, morning: [400, 405, 410, 415], exercise: 138, streak: 20, weekBase: 42 },
  tomas: { hr: 74, spo2: 98, temp: 36.8, bp: [121, 78], glucose: 94, sleep: 7.4, mood: 4, morning: [440, 443, 446, 450], exercise: 128, streak: 9, weekBase: 39 },
};
const RADIATION_BASE = 9.1;

/* ---------- seeded randomness ---------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function strHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Deterministic value in [0, 1) for a channel and an integer position. */
function hash(channel: number, n: number): number {
  let h = (channel ^ Math.imul(n | 0, 0x9e3779b1) ^ SEED) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth, bounded drift in [-1, 1]: random lattice values joined with a smooth step. It always pulls back toward zero. */
function drift(channel: number, t: number, periodSec: number): number {
  const x = t / periodSec;
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  const a = hash(channel, i) * 2 - 1;
  const b = hash(channel, i + 1) * 2 - 1;
  return a + (b - a) * s;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

/** A little resolved history per astronaut, so the symptom log has a past. Nothing active: scenarios stay as they are. */
function seedSymptoms(today: number): Symptom[] {
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

/* ---------- the mock ---------- */

/** Exercise session start times (minutes after midnight MET), morning and afternoon, per astronaut. */
const SESSION_START: Record<string, [number, number]> = {
  hana: [9 * 60, 13 * 60 + 30],
  mira: [8 * 60 + 30, 12 * 60 + 50],
  tomas: [10 * 60, 13 * 60 + 55],
};

export class MockSource implements DataSource {
  private wallStart = Date.now();
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | undefined;

  private scenario: ScenarioId = "hr-exercise";
  private target = "hana";
  /** The scenario's story is told relative to this MET. */
  private anchor = MET_AT_LOAD;
  private linkUp = true;
  private setting: MissionSettingId = "mars-transit";
  private sleepPeriod = false;

  private manual: Record<string, Record<string, Reading[]>> = {};
  private completions: Record<string, Record<string, number>> = {};
  private postponements: Record<string, Record<string, number>> = {};
  private alerts: (Alert & { clearSince?: number; resolved?: boolean })[] = [];
  private reports: Report[] = [];
  private reportSeq = 0;
  private symptoms: Symptom[] = [];
  private symptomSeq = 0;
  private cache = new Map<string, Reading[]>();
  private cacheTick = -1;

  constructor() {
    this.rebuild();
    this.updateAlerts();
  }

  /* ----- time ----- */

  private now(): number {
    return MET_AT_LOAD + (Date.now() - this.wallStart) / 1000;
  }

  private lastTick(): number {
    return Math.floor(this.now() / TICK_SEC) * TICK_SEC;
  }

  /* ----- seeded history for entered measurements ----- */

  private rebuild() {
    this.manual = {};
    this.completions = {};
    this.postponements = {};
    const today = startOfDay(MET_AT_LOAD);
    this.symptoms = seedSymptoms(today);
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
      this.manual[a.id] = m;
      this.completions[a.id] = { "bp-am": today + bpMin * MIN, "temp-am": today + tempMin * MIN, "glucose-am": today + gluMin * MIN, "sleep-review": today + sleepMin * MIN };
    }

    // Scenarios that change entered data.
    const t = this.manual[this.target];
    if (this.scenario === "hr-exercise") {
      // Today's session ended about 20 minutes ago; heart rate has not come back down.
      const at = this.anchor - 22 * MIN;
      t.exercise.push({ t: at, value: 124, device: "shirt" });
      this.completions[this.target].exercise = at;
    }
    if (this.scenario === "high-bp") {
      const last = t.bp[t.bp.length - 1];
      last.value = 148;
      last.value2 = 92;
    }
    if (this.scenario === "mood-falling") {
      const fall = [5, 5, 4, 4, 4, 3];
      const n = t.mood.length;
      fall.forEach((v, i) => {
        t.mood[n - fall.length + i].value = v;
        t.mood[n - fall.length + i].stress = v <= 3 ? 4 : 2;
      });
      const at = today + 14 * 3600 + 20 * MIN;
      t.mood.push({ t: at, value: 3, stress: 4, tags: ["Tired", "Unfocused"], device: "self" });
      this.completions[this.target].mood = at;
    }
  }

  /* ----- live signals: baseline + daily rhythm + slow mean-reverting drift + small noise ----- */

  private liveValue(astronautId: string, key: IndicatorKey, t: number): number | null {
    const onTarget = astronautId === this.target;
    const dt = t - this.anchor;
    const dayAngle = (((t % DAY) / DAY) - 0.42) * 2 * Math.PI;
    const rhythm = Math.cos(dayAngle);
    const ch = strHash(`${key}:${key === "radiation" ? "habitat" : astronautId}`);
    const slow = drift(ch, t, 3 * 3600);
    const fast = drift(ch + 1, t, 20 * MIN);
    const noise = hash(ch + 2, Math.floor(t / TICK_SEC)) * 2 - 1;

    if (key === "radiation") {
      let v = RADIATION_BASE + slow * 1.2 + fast * 0.4 + noise * 0.15;
      if (this.scenario === "solar-event") {
        const f = clamp01((dt + 43 * MIN) / (30 * MIN));
        v = lerp(v, 34 + fast * 1.5 + noise * 0.3, f);
      }
      return v;
    }

    const b = BASE[astronautId];
    if (this.scenario === "sensor-dropout" && onTarget && (key === "spo2" || key === "hr") && dt > -6 * MIN) return null;

    if (key === "hr") {
      // A daily exercise session at 16:00 lifts heart rate for about 45 minutes.
      const clock = t % DAY;
      const ex = Math.max(0, 1 - Math.abs(clock - (16 * 3600 + 22 * MIN)) / (26 * MIN));
      let v = b.hr + rhythm * 4 + slow * 3 + fast * 2 + noise * 1.2 + ex * ex * (3 - 2 * ex) * 24;
      if (this.scenario === "hr-exercise" && onTarget) {
        const f = clamp01((dt + 21 * MIN) / (14 * MIN));
        v = lerp(v, 119 + fast * 1.5 + noise * 0.8 + clamp01(dt / (20 * MIN)) * 2, f);
      }
      return v;
    }
    if (key === "spo2") {
      let v = Math.min(100, b.spo2 + slow * 0.4 + fast * 0.3 + noise * 0.3);
      if (this.scenario === "low-spo2" && onTarget) {
        const f = clamp01((dt + 13 * MIN) / (9 * MIN));
        v = lerp(v, 88 + fast * 0.2 + noise * 0.2, f);
      }
      return v;
    }
    // Only heart rate, SpO₂ and radiation are live. Temperature comes from the thermometer.
    return null;
  }

  private sample(astronautId: string, key: IndicatorKey, window: ChartWindow): Reading[] {
    const def = INDICATORS[key];
    const end = key === "radiation" ? Math.floor(this.now() / 60) * 60 : this.lastTick();
    const step = sampleStepSec(key, window);
    const start = end - WINDOW_SEC[window];
    const out: Reading[] = [];
    const push = (t: number) => {
      const v = this.liveValue(astronautId, key, t);
      if (v !== null) out.push({ t, value: v, device: def.device });
    };
    const first = Math.ceil(start / step) * step;
    for (let t = first; t < end; t += step) push(t);
    push(end);
    return out;
  }

  /* ----- DataSource ----- */

  getCrew(): Astronaut[] {
    return CREW;
  }

  getMission(): Mission {
    return {
      name: this.missionSetting().missionName,
      setting: this.setting,
      met: this.now(),
      earthLink: { up: this.linkUp, delaySec: this.missionSetting().delaySec },
      sleepPeriod: this.sleepPeriod,
      scenario: this.scenario,
      scenarioTarget: this.target,
    };
  }

  getReadings(astronautId: string, indicator: IndicatorKey, window: ChartWindow): Reading[] {
    const def = INDICATORS[indicator];
    if (def.source === "entered") {
      const from = this.now() - WINDOW_SEC[window === "1h" ? "24h" : window];
      return (this.manual[astronautId]?.[indicator] ?? []).filter((r) => r.t >= from);
    }
    const tick = this.lastTick();
    if (tick !== this.cacheTick) {
      this.cache.clear();
      this.cacheTick = tick;
    }
    const id = `${def.source === "habitat" ? "habitat" : astronautId}:${indicator}:${window}`;
    let hit = this.cache.get(id);
    if (!hit) {
      hit = this.sample(astronautId, indicator, window);
      this.cache.set(id, hit);
    }
    return hit;
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    if (!this.timer) this.timer = setInterval(() => this.tick(), TICK_SEC * 1000);
    return () => {
      this.listeners.delete(callback);
      if (!this.listeners.size && this.timer) {
        clearInterval(this.timer);
        this.timer = undefined;
      }
    };
  }

  private tick() {
    this.advanceReports();
    this.updateAlerts();
    this.emit();
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  private changed() {
    this.cache.clear();
    this.cacheTick = -1;
    this.advanceReports();
    this.updateAlerts();
    this.emit();
  }

  addReading(astronautId: string, indicator: IndicatorKey, reading: Omit<Reading, "t">, taskId?: string): Reading {
    const now = this.now();
    const r: Reading = { ...reading, t: now };
    (this.manual[astronautId][indicator] ??= []).push(r);
    // Mark the matching routine task done: the one that was started, or the first open one of this kind.
    const done = this.completions[astronautId];
    const open = routineEntries(ROUTINE, done, now, this.postponements[astronautId]).filter((e) => e.task.kind === indicator && (e.state.kind === "due" || e.state.kind === "overdue"));
    const task = open.find((e) => e.task.id === taskId) ?? open[0];
    if (task) done[task.task.id] = now;
    // A new reading taken during an alert is the "re-measure" step, so it goes in that alert's log.
    const alert = this.alerts.find((x) => x.astronautId === astronautId && x.indicator === indicator && !x.resolved);
    if (alert) alert.actions = [...alert.actions, { t: now, kind: "remeasured" }];
    this.changed();
    return r;
  }

  getExerciseSoFar(astronautId: string): number {
    const now = this.now();
    const day = startOfDay(now);
    // A confirmed total for today wins; otherwise count the planned sessions up to now.
    const confirmed = (this.manual[astronautId]?.exercise ?? []).filter((r) => r.t >= day).at(-1);
    if (confirmed) return confirmed.value;
    const b = BASE[astronautId];
    if (!b) return 0;
    // Resistance in the morning for 60 min, aerobic in the afternoon for the rest of the usual daily total.
    // Each astronaut has their own slots, so the running totals differ.
    const [am, pm] = SESSION_START[astronautId] ?? [9 * 60, 13 * 60 + 30];
    const sessions: [number, number][] = [[am, 60], [pm, b.exercise - 60]];
    const minute = (now - day) / 60;
    return Math.round(sessions.reduce((sum, [start, len]) => sum + Math.max(0, Math.min(len, minute - start)), 0));
  }

  getRoutine(astronautId: string): RoutineSummary {
    const now = this.now();
    const entries = routineEntries(ROUTINE, this.completions[astronautId] ?? {}, now, this.postponements[astronautId]);
    const done = entries.filter((e) => e.state.kind === "done").length;
    const b = BASE[astronautId];
    return { entries, done, total: entries.length, streakDays: b.streak, weekDone: b.weekBase + done, weekTotal: ROUTINE.length * 7 };
  }

  completeTask(astronautId: string, taskId: string): void {
    this.completions[astronautId][taskId] = this.now();
    this.changed();
  }

  postponeTask(astronautId: string, taskId: string, minutes = POSTPONE_MIN): void {
    (this.postponements[astronautId] ??= {})[taskId] = this.now() + minutes * MIN;
    this.changed();
  }

  /* ----- symptoms ----- */

  getSymptoms(astronautId: string): Symptom[] {
    return this.symptoms.filter((x) => x.astronautId === astronautId).sort((a, b) => b.t - a.t);
  }

  addSymptom(astronautId: string, symptom: NewSymptom): Symptom {
    const now = this.now();
    const s: Symptom = { ...symptom, id: `sym-${++this.symptomSeq}`, astronautId, t: now, startedAt: Math.min(symptom.startedAt, now) };
    this.symptoms = [...this.symptoms, s];
    this.changed();
    return s;
  }

  resolveSymptom(symptomId: string): void {
    const now = this.now();
    this.symptoms = this.symptoms.map((x) => (x.id === symptomId && x.resolvedAt === undefined ? { ...x, resolvedAt: now } : x));
    this.changed();
  }

  getAlerts(astronautId: string): Alert[] {
    return this.alerts.filter((a) => a.astronautId === astronautId && !a.resolved);
  }

  acknowledgeAlert(alertId: string): void {
    const a = this.alerts.find((x) => x.id === alertId);
    if (!a || a.acknowledged) return;
    a.acknowledged = true;
    a.acknowledgedAt = this.now();
    this.emit();
  }

  logAction(alertId: string, kind: AlertActionKind, note?: string): void {
    const a = this.alerts.find((x) => x.id === alertId);
    if (!a) return;
    a.actions = [...a.actions, { t: this.now(), kind, note }];
    this.emit();
  }

  queueReport(astronautId: string, report: NewReport): Report {
    const now = this.now();
    const r: Report = { id: `report-${++this.reportSeq}`, astronautId, createdAt: now, ...report, state: "queued" };
    this.reports = [...this.reports, r];
    this.advanceReports();
    this.emit();
    return r;
  }

  getDownlinkQueue(): Report[] {
    return this.reports;
  }

  setScenario(scenario: ScenarioId, astronautId: string): void {
    this.scenario = scenario;
    this.target = astronautId;
    this.anchor = this.lastTick();
    this.alerts = [];
    this.rebuild();
    this.changed();
  }

  setEarthLink(up: boolean): void {
    this.linkUp = up;
    this.advanceReports();
    this.emit();
  }

  private missionSetting(): MissionSetting {
    return MISSION_SETTINGS.find((m) => m.id === this.setting) ?? MISSION_SETTINGS[0];
  }

  setMissionSetting(setting: MissionSettingId): void {
    this.setting = setting;
    this.emit();
  }

  setSleepPeriod(on: boolean): void {
    this.sleepPeriod = on;
    this.emit();
  }

  /* ----- reports and alerts ----- */

  private advanceReports() {
    const now = this.now();
    const delay = this.missionSetting().delaySec;
    let dirty = false;
    const next = this.reports.map((r) => {
      if (r.state === "queued" && this.linkUp) {
        dirty = true;
        return { ...r, state: "in-transit" as const, sentAt: now, arrivesAt: now + delay };
      }
      if (r.state === "in-transit" && r.arrivesAt !== undefined && now >= r.arrivesAt) {
        dirty = true;
        return { ...r, state: "delivered" as const };
      }
      return r;
    });
    if (dirty) this.reports = next;
  }

  private evaluateFor(astronautId: string, key: IndicatorKey, now: number): Evaluation {
    const routine = routineContext(routineEntries(ROUTINE, this.completions[astronautId] ?? {}, now, this.postponements[astronautId]), key);
    return evaluate(key, this.getReadings(astronautId, key, INDICATORS[key].source === "entered" ? "30d" : "1h"), { now, routine });
  }

  private updateAlerts() {
    const now = this.now();
    for (const a of CREW) {
      for (const key of INDICATOR_KEYS) {
        const def = INDICATORS[key];
        const ev = this.evaluateFor(a.id, key, now);
        const active = this.alerts.find((x) => x.astronautId === a.id && x.indicator === key && !x.resolved);
        if (ev.status === "caution" || ev.status === "warning") {
          const since = ev.since ?? now;
          const sustained = def.source === "entered" || now - since >= SUSTAIN_SEC;
          const r = ev.latest;
          const valueText = r ? `${formatValue(key, r.value, r.value2)}${key === "mood" ? "" : ` ${def.unit}`}` : "";
          const sustain = def.source === "entered" ? "" : ` Held for at least ${SUSTAIN_SEC} seconds.`;
          const rule = `${ruleText(key, ev)}${sustain} Reading: ${valueText} at ${formatClock(r?.t ?? now)} MET.`;
          if (!active) {
            if (!sustained) continue;
            this.alerts.push({ id: `${a.id}-${key}-${Math.round(since)}`, astronautId: a.id, indicator: key, status: ev.status, firedAt: since, rule, acknowledged: false, actions: [] });
          } else {
            active.clearSince = undefined;
            if (active.status !== ev.status) {
              // A change of level is a new event: it needs a new acknowledgement.
              if (ev.status === "warning") active.acknowledged = false;
              active.status = ev.status;
            }
            active.rule = rule;
          }
        } else if (active) {
          // Hysteresis: the alert ends only after the value has stayed clear.
          active.clearSince ??= now;
          if (def.source === "entered" || now - active.clearSince >= SUSTAIN_SEC) active.resolved = true;
        }
      }
    }
  }
}

export const mockSource = new MockSource();
