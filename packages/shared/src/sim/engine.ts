// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// One crew session's state and everything derived from it: entered readings, routine, symptoms, alerts with their
// acknowledgements and actions, the downlink queue and the demo settings, on top of the shared simulator.
// The clock is injected, so the same engine runs in the browser (local mode, wall clock) and on the server (the
// session's own clock, rebuilt from stored rows). No timers, no browser APIs.
import { INDICATORS, INDICATOR_KEYS, WINDOW_SEC, formatValue } from "../indicators";
import { POSTPONE_MIN, ROUTINE, routineContext, routineEntries } from "../routine";
import { MISSION_SETTINGS } from "../scenarios";
import { evaluate, lookbackHistory, ruleText, type Evaluation } from "../status";
import { formatClock, startOfDay } from "../time";
import type { ReplayedEvent } from "../radiation/replay";
import type { NewSymptom, Symptom } from "../symptoms";
import type {
  Alert,
  AlertActionKind,
  Astronaut,
  ChartWindow,
  IndicatorKey,
  Mission,
  MissionSetting,
  MissionSettingId,
  NewReport,
  Reading,
  Report,
  RoutineSummary,
  ScenarioId,
} from "../types";
import { BASE, CREW, MET_AT_LOAD, MIN, SUSTAIN_SEC, TICK_SEC } from "./crew";
import { exerciseSoFar } from "./exercise";
import { seedEntered, seedSymptoms } from "./history";
import { sampleLive, solarEvents, type SimScenario } from "./live";

export class SessionEngine {
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

  /** Called after every change, so a holder can re-render or persist. */
  onChange: (() => void) | undefined;

  /** `clock` returns the current MET in seconds. */
  constructor(private readonly clock: () => number) {
    this.rebuild();
    this.updateAlerts();
  }

  /* ----- time ----- */

  now(): number {
    return this.clock();
  }

  private lastTick(): number {
    return Math.floor(this.now() / TICK_SEC) * TICK_SEC;
  }

  /* ----- seeded history for entered measurements ----- */

  private rebuild() {
    const seeded = seedEntered(this.sim());
    this.manual = seeded.manual;
    this.completions = seeded.completions;
    this.postponements = {};
    this.symptoms = seedSymptoms();
  }

  /** What the shared simulator needs to know about the current scenario. */
  private sim(): SimScenario {
    return { scenario: this.scenario, target: this.target, anchor: this.anchor };
  }

  private sample(astronautId: string, key: IndicatorKey, window: ChartWindow): Reading[] {
    const end = INDICATORS[key].source === "habitat" ? Math.floor(this.now() / 60) * 60 : this.lastTick();
    return sampleLive(this.sim(), astronautId, key, window, end);
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

  /** Advance time-driven state: reports in transit, alerts opening and closing. Call every TICK_SEC. */
  tick() {
    this.advanceReports();
    this.updateAlerts();
    this.emit();
  }

  private emit() {
    this.onChange?.();
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
    return exerciseSoFar(astronautId, now);
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

  getSolarEvents(): ReplayedEvent[] {
    return solarEvents(this.sim());
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
    const entered = INDICATORS[key].source === "entered";
    const history = entered ? undefined : () => lookbackHistory((w) => this.getReadings(astronautId, key, w));
    return evaluate(key, this.getReadings(astronautId, key, entered ? "30d" : "1h"), { now, routine, history });
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
