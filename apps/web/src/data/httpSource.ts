// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The DataSource in server mode. The onboard server stores everything the astronaut does; this client rebuilds the
// same session engine from the rows /api/state returns (packages/shared/src/api/rebuild.ts), so every getter stays
// synchronous and live readings come from the shared simulator, with no need to send them over the network.
// Polls /api/state every 5 seconds while the tab is visible. Actions apply locally at once and are posted to the
// API; its answer replaces the local copy. Three failed calls in a row hand over to local mode (onFail).
import {
  POSTPONE_MIN,
  StateResponse,
  TICK_SEC,
  rebuildSession,
  type AlertActionKind,
  type Astronaut,
  type ChartWindow,
  type IndicatorKey,
  type MissionSettingId,
  type NewReport,
  type NewSymptom,
  type Reading,
  type Rebuilt,
  type Report,
  type RoutineSummary,
  type ScenarioId,
  type StateResponseT,
  type Symptom,
} from "@missionvitals/shared";
import type { DataSource } from "./DataSource";

const TIMEOUT_MS = 8000;
const FAILS_BEFORE_FALLBACK = 3;

export async function api<T = unknown>(path: string, init?: { method?: "GET" | "POST"; body?: unknown; timeoutMs?: number }): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(init?.timeoutMs ?? TIMEOUT_MS),
  });
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) throw new Error(`/api/${path}: not a JSON answer (HTTP ${res.status})`);
  const json = (await res.json()) as T & { error?: string };
  if (!res.ok) throw Object.assign(new Error(json.error ?? `HTTP ${res.status}`), { status: res.status });
  return json;
}

export class HttpSource implements DataSource {
  private state!: StateResponseT;
  private rebuilt!: Rebuilt;
  /** Local wall time when `state` arrived, to run the session clock on between polls. */
  private fetchedAt = 0;
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private failures = 0;
  private stopped = false;
  /** Bumped by every action, so a poll that started before it can't overwrite its result. */
  private seq = 0;
  private pending = 0;

  constructor(
    private readonly session: string,
    initial: StateResponseT,
    private readonly onFail: () => void,
  ) {
    this.apply(initial);
  }

  /* ----- clock and state ----- */

  private nowWall(): string {
    return new Date(Date.parse(this.state.serverTime) + (Date.now() - this.fetchedAt)).toISOString();
  }

  private apply(s: StateResponseT) {
    this.state = s;
    this.fetchedAt = Date.now();
    this.rebuilt = rebuildSession(s.session, s.rows, s.serverTime);
  }

  /** The engine, with its clock moved to now. */
  private get e() {
    this.rebuilt.setNow(this.rebuilt.clock.met(this.nowWall()));
    return this.rebuilt.engine;
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  private fail(err: unknown) {
    // Bad input (4xx) is a bug to log, not a sign the server is down.
    const status = (err as { status?: number }).status;
    if (status !== undefined && status < 500) {
      console.warn("API refused a request:", (err as Error).message);
      return;
    }
    this.failures++;
    if (this.failures >= FAILS_BEFORE_FALLBACK && !this.stopped) {
      this.stop();
      this.onFail();
    }
  }

  private stop() {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  private async poll() {
    if (this.stopped || document.hidden) return;
    const started = this.seq;
    try {
      const s = StateResponse.parse(await api(`state?session=${this.session}`));
      this.failures = 0;
      if (this.pending || started !== this.seq) return;
      this.apply(s);
      this.emit();
    } catch (err) {
      this.fail(err);
    }
  }

  /** Post an action; its answer (the new state) replaces the local copy. */
  private send(path: string, body: Record<string, unknown>) {
    this.seq++;
    this.pending++;
    api<{ state?: unknown }>(path, { method: "POST", body: { session: this.session, ...body } })
      .then((r) => {
        this.failures = 0;
        if (r.state) {
          this.apply(StateResponse.parse(r.state));
          this.emit();
        }
      })
      .catch((err) => this.fail(err))
      .finally(() => {
        this.pending--;
      });
  }

  private onVisibility = () => {
    if (!document.hidden) void this.poll();
  };

  /* ----- DataSource: reads ----- */

  getCrew(): Astronaut[] {
    return this.e.getCrew();
  }
  getMission() {
    return this.e.getMission();
  }
  getReadings(astronautId: string, indicator: IndicatorKey, window: ChartWindow): Reading[] {
    return this.e.getReadings(astronautId, indicator, window);
  }
  getExerciseSoFar(astronautId: string): number {
    return this.e.getExerciseSoFar(astronautId);
  }
  getRoutine(astronautId: string): RoutineSummary {
    return this.e.getRoutine(astronautId);
  }
  getSymptoms(astronautId: string): Symptom[] {
    return this.e.getSymptoms(astronautId);
  }
  getAlerts(astronautId: string) {
    return this.e.getAlerts(astronautId);
  }
  getDownlinkQueue(): Report[] {
    return this.e.getDownlinkQueue();
  }
  getSolarEvents() {
    return this.e.getSolarEvents();
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    if (!this.timer && !this.stopped) {
      this.timer = setInterval(() => void this.poll(), TICK_SEC * 1000);
      document.addEventListener("visibilitychange", this.onVisibility);
    }
    return () => {
      this.listeners.delete(callback);
      if (!this.listeners.size && this.timer) {
        clearInterval(this.timer);
        this.timer = undefined;
        document.removeEventListener("visibilitychange", this.onVisibility);
      }
    };
  }

  /* ----- DataSource: actions (local at once, then the server) ----- */

  addReading(astronautId: string, indicator: IndicatorKey, reading: Omit<Reading, "t">, taskId?: string): Reading {
    const r = this.e.addReading(astronautId, indicator, reading, taskId);
    this.send("readings", {
      astronaut: astronautId,
      indicator,
      value: reading.value,
      value2: reading.value2,
      pulse: reading.pulse,
      timing: reading.timing,
      stress: reading.stress,
      tags: reading.tags,
      note: reading.note,
      device: reading.device,
      taskId,
    });
    this.emit();
    return r;
  }

  completeTask(astronautId: string, taskId: string): void {
    this.e.completeTask(astronautId, taskId);
    this.send("routine/complete", { astronaut: astronautId, taskId });
    this.emit();
  }

  postponeTask(astronautId: string, taskId: string, minutes = POSTPONE_MIN): void {
    this.e.postponeTask(astronautId, taskId, minutes);
    this.send("routine/postpone", { astronaut: astronautId, taskId, minutes });
    this.emit();
  }

  addSymptom(astronautId: string, symptom: NewSymptom): Symptom {
    const s = this.e.addSymptom(astronautId, symptom);
    this.send("symptoms", { astronaut: astronautId, partId: symptom.partId, layer: symptom.layer, kind: symptom.kind, severity: symptom.severity, startedAt: symptom.startedAt, affectsWork: symptom.affectsWork, note: symptom.note });
    this.emit();
    return s;
  }

  resolveSymptom(symptomId: string): void {
    this.e.resolveSymptom(symptomId);
    // A symptom not yet saved has a local id; the next state from the server brings its stored id.
    if (symptomId.startsWith("sym-db-")) this.send(`symptoms/${symptomId}/resolve`, {});
    this.emit();
  }

  acknowledgeAlert(alertId: string): void {
    this.e.acknowledgeAlert(alertId);
    this.send(`alerts/${encodeURIComponent(alertId)}/acknowledge`, {});
    this.emit();
  }

  logAction(alertId: string, kind: AlertActionKind, note?: string): void {
    this.e.logAction(alertId, kind, note);
    this.send(`alerts/${encodeURIComponent(alertId)}/actions`, { kind, note });
    this.emit();
  }

  queueReport(astronautId: string, report: NewReport): Report {
    const r = this.e.queueReport(astronautId, report);
    this.send("reports", { astronaut: astronautId, urgency: report.urgency, note: report.note, items: report.items, actions: report.actions, symptoms: report.symptoms });
    this.emit();
    return r;
  }

  setScenario(scenario: ScenarioId, astronautId: string): void {
    this.e.setScenario(scenario, astronautId);
    this.send("demo", { scenario, target: astronautId });
    this.emit();
  }

  setEarthLink(up: boolean): void {
    this.e.setEarthLink(up);
    this.send("demo", { earthLinkUp: up });
    this.emit();
  }

  setMissionSetting(setting: MissionSettingId): void {
    this.e.setMissionSetting(setting);
    this.send("demo", { missionSetting: setting });
    this.emit();
  }

  setSleepPeriod(on: boolean): void {
    this.e.setSleepPeriod(on);
    this.send("demo", { sleepPeriod: on });
    this.emit();
  }
}
