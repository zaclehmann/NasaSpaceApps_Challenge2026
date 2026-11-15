// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The Store in memory, for tests (no network). Behaves like the database: ids per table, rows scoped to a session,
// cascade on session delete, and the unique rule on alert openings. `down` makes it act like an unreachable database.
import type { ActionRowT, AlertRowT, ReadingRowT, ReportRowT, RoutineRowT, SessionInfoT, SessionRowsT, SymptomRowT } from "@missionvitals/shared";
import type { SessionPatch, Store, Table } from "./store";

type WithSession<T> = T & { sessionId: string };

export class MemoryStore implements Store {
  down = false;
  private seq = 0;
  sessions = new Map<string, SessionInfoT>();
  readings: WithSession<ReadingRowT>[] = [];
  symptoms: WithSession<SymptomRowT>[] = [];
  routine: WithSession<RoutineRowT>[] = [];
  alerts: WithSession<AlertRowT>[] = [];
  actions: ActionRowT[] = [];
  reports: WithSession<ReportRowT>[] = [];

  private guard() {
    if (this.down) throw new Error("database unreachable");
  }
  private id() {
    return ++this.seq;
  }
  private strip<T extends { sessionId: string }>(r: T): Omit<T, "sessionId"> {
    const { sessionId: _s, ...rest } = r;
    return rest;
  }

  async ping() {
    return !this.down;
  }
  async getSession(id: string) {
    this.guard();
    return this.sessions.get(id) ?? null;
  }
  async ensureSession(id: string, now: string) {
    this.guard();
    if (!this.sessions.has(id))
      this.sessions.set(id, { id, createdAt: now, astronautId: null, scenario: "hr-exercise", scenarioTarget: "hana", scenarioStartedAt: now, earthLinkUp: true, sleepPeriod: false, missionSetting: "mars-transit" });
    return this.sessions.get(id)!;
  }
  async updateSession(id: string, p: SessionPatch) {
    this.guard();
    const s = this.sessions.get(id);
    if (!s) return;
    const { lastSeenAt: _l, ...rest } = p;
    this.sessions.set(id, { ...s, ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) });
  }
  async deleteSession(id: string) {
    this.guard();
    this.sessions.delete(id);
    await this.clearScenarioRows(id);
    this.reports = this.reports.filter((r) => r.sessionId !== id);
  }
  async clearScenarioRows(id: string) {
    this.guard();
    const gone = new Set(this.alerts.filter((a) => a.sessionId === id).map((a) => a.id));
    this.readings = this.readings.filter((r) => r.sessionId !== id);
    this.symptoms = this.symptoms.filter((r) => r.sessionId !== id);
    this.routine = this.routine.filter((r) => r.sessionId !== id);
    this.alerts = this.alerts.filter((r) => r.sessionId !== id);
    this.actions = this.actions.filter((a) => !gone.has(a.alertEventId));
  }
  async loadRows(id: string): Promise<SessionRowsT> {
    this.guard();
    const mine = <T extends { sessionId: string }>(rows: T[]) => rows.filter((r) => r.sessionId === id).map((r) => this.strip(r));
    const alertIds = new Set(this.alerts.filter((a) => a.sessionId === id).map((a) => a.id));
    return {
      readings: mine(this.readings),
      symptoms: mine(this.symptoms),
      routine: mine(this.routine),
      alerts: mine(this.alerts),
      actions: this.actions.filter((a) => alertIds.has(a.alertEventId)),
      reports: mine(this.reports),
    };
  }
  async count(table: Table, sessionId: string) {
    this.guard();
    const rows = (await this.loadRows(sessionId)) as unknown as Record<string, unknown[]>;
    const key = { entered_readings: "readings", symptoms: "symptoms", routine_events: "routine", alert_events: "alerts", alert_actions: "actions", reports: "reports" }[table];
    return rows[key].length;
  }
  async insertReading(sessionId: string, r: Omit<ReadingRowT, "id">) {
    this.guard();
    const row = { ...r, id: this.id(), sessionId };
    this.readings.push(row);
    return this.strip(row);
  }
  async insertSymptom(sessionId: string, r: Omit<SymptomRowT, "id">) {
    this.guard();
    const row = { ...r, id: this.id(), sessionId };
    this.symptoms.push(row);
    return this.strip(row);
  }
  async resolveSymptom(sessionId: string, rowId: number, at: string) {
    this.guard();
    const s = this.symptoms.find((x) => x.sessionId === sessionId && x.id === rowId && !x.resolvedAt);
    if (!s) return false;
    s.resolvedAt = at;
    return true;
  }
  async insertRoutine(sessionId: string, r: Omit<RoutineRowT, "id">) {
    this.guard();
    const row = { ...r, id: this.id(), sessionId };
    this.routine.push(row);
    return this.strip(row);
  }
  async insertAlert(sessionId: string, r: Omit<AlertRowT, "id">) {
    this.guard();
    const same = this.alerts.find((a) => a.sessionId === sessionId && a.astronautId === r.astronautId && a.indicator === r.indicator && a.openedAt === r.openedAt);
    if (same) return this.strip(same);
    const row = { ...r, id: this.id(), sessionId };
    this.alerts.push(row);
    return this.strip(row);
  }
  async updateAlert(sessionId: string, rowId: number, p: Partial<Pick<AlertRowT, "acknowledgedAt" | "resolvedAt" | "severity">>) {
    this.guard();
    const a = this.alerts.find((x) => x.sessionId === sessionId && x.id === rowId);
    if (a) Object.assign(a, p);
  }
  async insertAction(sessionId: string, r: Omit<ActionRowT, "id">) {
    this.guard();
    if (!this.alerts.some((a) => a.sessionId === sessionId && a.id === r.alertEventId)) throw new Error("insert action: alert not in session");
    const row = { ...r, id: this.id() };
    this.actions.push(row);
    return row;
  }
  async insertReport(sessionId: string, r: Omit<ReportRowT, "id">) {
    this.guard();
    const row = { ...r, id: this.id(), sessionId };
    this.reports.push(row);
    return this.strip(row);
  }
  async sendQueuedReports(sessionId: string, at: string) {
    this.guard();
    for (const r of this.reports) if (r.sessionId === sessionId && !r.sentAt) r.sentAt = at;
  }
}
