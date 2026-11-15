// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The DataSource in server mode. The onboard server stores everything the astronaut does; this client rebuilds the
// same session engine from the rows /api/state returns (packages/shared/src/api/rebuild.ts), so every getter stays
// synchronous and live readings come from the shared simulator, with no need to send them over the network.
// Polls /api/state every 5 seconds while the tab is visible. Actions apply locally at once and are posted to the
// API; its answer replaces the local copy. Three failed calls in a row hand over to local mode (onFail).
//
// Actions during a save in flight (audit bugs A and B):
// - Each action carries the time it happened (takenAt, loggedAt), so the server computes the same alert ids.
// - A pending action stays in an overlay that is re-applied on top of every state from the server until its own
//   request answers, so nothing flickers back.
// - A follow-up that refers to something still being created (resolving a just-logged symptom, acknowledging the
//   alert from a just-saved reading) waits for that create, then is sent with the server's id. Never dropped.
import {
  POSTPONE_MIN,
  StateResponse,
  TICK_SEC,
  rebuildSession,
  symptomIdOf,
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
  type SessionEngine,
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
  /** Actions not yet confirmed by the server, re-applied (at their own time) on top of each new server state. */
  private overlay: { met: number; run: (e: SessionEngine) => void }[] = [];
  /** Creates still in flight: "symptom:<local id>" and "reading:<astronaut>:<indicator>". */
  private inflight = new Map<string, Promise<unknown>>();
  /** Local symptom id to the server's, once its create has answered. */
  private idMap = new Map<string, string>();

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
    if (this.overlay.length) {
      const now = this.rebuilt.clock.met(this.nowWall());
      for (const op of this.overlay) {
        this.rebuilt.setNow(op.met);
        op.run(this.rebuilt.engine);
      }
      this.rebuilt.setNow(now);
    }
  }

  /** The wall-clock ISO time of a mission time, on this session's clock. */
  private wall(met: number): string {
    return this.rebuilt.clock.wall(met);
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

  /**
   * Apply an action locally now, keep it in the overlay, and send it. `send` may wait for a create in flight first.
   * When the server answers, the action leaves the overlay and the server's state replaces the local copy.
   */
  private act(run: (e: SessionEngine) => void, send: () => Promise<{ state?: unknown } | void>): Promise<unknown> {
    // One time for the action, used now and on every replay, so its reading time and alert id never drift.
    const op = { met: this.rebuilt.clock.met(this.nowWall()), run };
    this.rebuilt.setNow(op.met);
    run(this.rebuilt.engine);
    this.overlay.push(op);
    this.seq++;
    this.pending++;
    this.emit();
    const done = () => {
      this.overlay = this.overlay.filter((o) => o !== op);
    };
    const p = send()
      .then((r) => {
        this.failures = 0;
        done();
        if (r && r.state) this.apply(StateResponse.parse(r.state));
        else this.apply(this.state);
        this.emit();
        return r;
      })
      .catch((err) => {
        done();
        this.apply(this.state);
        this.emit();
        this.fail(err);
        throw err;
      })
      .finally(() => {
        this.pending--;
      });
    p.catch(() => undefined);
    return p;
  }

  private post(path: string, body: Record<string, unknown>) {
    return api<{ state?: unknown }>(path, { method: "POST", body: { session: this.session, ...body } });
  }

  /** Waits for a create in flight (ignoring its failure, which is reported on its own). */
  private async after(key: string | undefined) {
    const p = key ? this.inflight.get(key) : undefined;
    if (p) await p.catch(() => undefined);
  }

  /** An alert id is "<astronaut>-<indicator>-<time>"; the create it may depend on is that reading. */
  private readingKeyOf(alertId: string): string | undefined {
    const m = /^([a-z]+)-([a-z0-9]+)-/.exec(alertId);
    return m ? `reading:${m[1]}:${m[2]}` : undefined;
  }

  /** The open alert with this id, or the open one for the same astronaut and indicator. */
  private alertIn(e: SessionEngine, alertId: string): string | undefined {
    const m = /^([a-z]+)-([a-z0-9]+)-/.exec(alertId);
    const list = m ? e.getAlerts(m[1]) : [];
    return (list.find((a) => a.id === alertId) ?? list.find((a) => m && a.indicator === m[2]))?.id;
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
    let r!: Reading;
    let t: number | undefined;
    const key = `reading:${astronautId}:${indicator}`;
    const p = this.act(
      (e) => {
        r = e.addReading(astronautId, indicator, reading, taskId);
        t ??= r.t;
      },
      () =>
        this.post("readings", {
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
          takenAt: this.wall(t!),
        }),
    );
    this.inflight.set(key, p);
    void p.finally(() => this.inflight.get(key) === p && this.inflight.delete(key)).catch(() => undefined);
    return r;
  }

  completeTask(astronautId: string, taskId: string): void {
    void this.act((e) => e.completeTask(astronautId, taskId), () => this.post("routine/complete", { astronaut: astronautId, taskId }));
  }

  postponeTask(astronautId: string, taskId: string, minutes = POSTPONE_MIN): void {
    void this.act((e) => e.postponeTask(astronautId, taskId, minutes), () => this.post("routine/postpone", { astronaut: astronautId, taskId, minutes }));
  }

  addSymptom(astronautId: string, symptom: NewSymptom): Symptom {
    let s!: Symptom;
    let localId: string | undefined;
    const p = this.act(
      (e) => {
        s = e.addSymptom(astronautId, symptom, localId);
        localId ??= s.id;
      },
      () =>
        this.post("symptoms", {
          astronaut: astronautId,
          partId: symptom.partId,
          layer: symptom.layer,
          kind: symptom.kind,
          severity: symptom.severity,
          startedAt: symptom.startedAt,
          affectsWork: symptom.affectsWork,
          note: symptom.note,
          loggedAt: this.wall(s.t),
        }).then((r) => {
          const row = (r as { symptom?: { id: number } }).symptom;
          if (row) this.idMap.set(localId!, symptomIdOf(row.id));
          return r;
        }),
    );
    const key = `symptom:${localId}`;
    this.inflight.set(key, p);
    void p.finally(() => this.inflight.delete(key)).catch(() => undefined);
    return s;
  }

  resolveSymptom(symptomId: string): void {
    const serverId = () => this.idMap.get(symptomId) ?? symptomId;
    void this.act(
      (e) => e.resolveSymptom(serverId()),
      async () => {
        // A symptom logged a moment ago may still be saving: wait for it, then resolve it by the server's id.
        await this.after(`symptom:${symptomId}`);
        const id = serverId();
        if (!id.startsWith("sym-db-")) throw new Error("The symptom was not saved, so it can't be marked as gone on the server.");
        return this.post(`symptoms/${id}/resolve`, {});
      },
    );
  }

  acknowledgeAlert(alertId: string): void {
    void this.act(
      (e) => {
        const id = this.alertIn(e, alertId);
        if (id) e.acknowledgeAlert(id);
      },
      async () => {
        // The reading that opened this alert may still be saving: wait for it first.
        await this.after(this.readingKeyOf(alertId));
        return this.post(`alerts/${encodeURIComponent(alertId)}/acknowledge`, {});
      },
    );
  }

  logAction(alertId: string, kind: AlertActionKind, note?: string): void {
    void this.act(
      (e) => {
        const id = this.alertIn(e, alertId);
        if (id) e.logAction(id, kind, note);
      },
      async () => {
        await this.after(this.readingKeyOf(alertId));
        return this.post(`alerts/${encodeURIComponent(alertId)}/actions`, { kind, note });
      },
    );
  }

  queueReport(astronautId: string, report: NewReport): Report {
    let r!: Report;
    void this.act(
      (e) => {
        r = e.queueReport(astronautId, report);
      },
      () => this.post("reports", { astronaut: astronautId, urgency: report.urgency, note: report.note, items: report.items, actions: report.actions, symptoms: report.symptoms }),
    );
    return r;
  }

  setScenario(scenario: ScenarioId, astronautId: string): void {
    void this.act((e) => e.setScenario(scenario, astronautId), () => this.post("demo", { scenario, target: astronautId }));
  }

  setEarthLink(up: boolean): void {
    void this.act((e) => e.setEarthLink(up), () => this.post("demo", { earthLinkUp: up }));
  }

  setMissionSetting(setting: MissionSettingId): void {
    void this.act((e) => e.setMissionSetting(setting), () => this.post("demo", { missionSetting: setting }));
  }

  setSleepPeriod(on: boolean): void {
    void this.act((e) => e.setSleepPeriod(on), () => this.post("demo", { sleepPeriod: on }));
  }
}
