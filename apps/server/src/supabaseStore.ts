// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The Store on Supabase (Postgres), using the service role key. Row Level Security is on with no policies, so only
// this server key can read or write. Columns are snake_case in the database and camelCase on the wire.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ActionRowT, AlertRowT, ReadingRowT, ReportRowT, RoutineRowT, SessionInfoT, SessionRowsT, SymptomRowT } from "@missionvitals/shared";
import type { ServerEnv } from "./env";
import type { SessionPatch, Store, Table } from "./store";

type Row = Record<string, unknown>;
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const str = (v: unknown) => (v === null || v === undefined ? null : String(v));

const toSession = (r: Row): SessionInfoT => ({
  id: String(r.id),
  createdAt: String(r.created_at),
  astronautId: (r.astronaut_id as SessionInfoT["astronautId"]) ?? null,
  scenario: r.scenario as SessionInfoT["scenario"],
  scenarioTarget: r.scenario_target as SessionInfoT["scenarioTarget"],
  scenarioStartedAt: String(r.scenario_started_at),
  earthLinkUp: Boolean(r.earth_link_up),
  sleepPeriod: Boolean(r.sleep_period),
  missionSetting: r.mission_setting as SessionInfoT["missionSetting"],
  lastSeenAt: r.last_seen_at ? String(r.last_seen_at) : undefined,
});
const toReading = (r: Row): ReadingRowT => ({
  id: Number(r.id),
  astronautId: r.astronaut_id as ReadingRowT["astronautId"],
  indicator: r.indicator as ReadingRowT["indicator"],
  value: Number(r.value),
  value2: num(r.value2),
  context: (r.context as ReadingRowT["context"]) ?? null,
  pulse: num(r.pulse),
  stress: num(r.stress),
  tags: (r.tags as string[] | null) ?? null,
  note: str(r.note),
  device: r.device as ReadingRowT["device"],
  taskId: str(r.task_id),
  takenAt: String(r.taken_at),
});
const toSymptom = (r: Row): SymptomRowT => ({
  id: Number(r.id),
  astronautId: r.astronaut_id as SymptomRowT["astronautId"],
  bodyPart: String(r.body_part),
  layer: r.layer as SymptomRowT["layer"],
  symptom: String(r.symptom),
  severity: Number(r.severity),
  affectsWork: Boolean(r.affects_work),
  note: str(r.note),
  startedAt: String(r.started_at),
  loggedAt: String(r.logged_at),
  resolvedAt: str(r.resolved_at),
});
const toRoutine = (r: Row): RoutineRowT => ({
  id: Number(r.id),
  astronautId: r.astronaut_id as RoutineRowT["astronautId"],
  taskId: String(r.task_id),
  day: String(r.day),
  kind: r.kind as RoutineRowT["kind"],
  at: String(r.at),
  postponedUntil: str(r.postponed_until),
});
const toAlert = (r: Row): AlertRowT => ({
  id: Number(r.id),
  astronautId: r.astronaut_id as AlertRowT["astronautId"],
  indicator: r.indicator as AlertRowT["indicator"],
  severity: r.severity as AlertRowT["severity"],
  openedAt: String(r.opened_at),
  acknowledgedAt: str(r.acknowledged_at),
  resolvedAt: str(r.resolved_at),
});
const toAction = (r: Row): ActionRowT => ({ id: Number(r.id), alertEventId: Number(r.alert_event_id), kind: r.kind as ActionRowT["kind"], note: str(r.note), at: String(r.at) });
const toReport = (r: Row): ReportRowT => ({
  id: Number(r.id),
  astronautId: r.astronaut_id as ReportRowT["astronautId"],
  urgency: r.urgency as ReportRowT["urgency"],
  note: str(r.note),
  summary: (r.summary as ReportRowT["summary"]) ?? { items: [], actions: [] },
  queuedAt: String(r.queued_at),
  sentAt: str(r.sent_at),
});

/** Throws a plain Error (the router turns it into a generic 500 and logs the detail server-side). */
function check<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

export class SupabaseStore implements Store {
  private db: SupabaseClient;

  constructor(env: ServerEnv) {
    this.db = createClient(env.supabaseUrl, env.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async ping(): Promise<boolean> {
    try {
      const res = await Promise.race([
        this.db.from("sessions").select("id", { head: true, count: "exact" }).limit(1),
        new Promise<{ error: { message: string } }>((resolve) => setTimeout(() => resolve({ error: { message: "timeout" } }), 3000)),
      ]);
      return !res.error;
    } catch {
      return false;
    }
  }

  async getSession(id: string) {
    const data = check(await this.db.from("sessions").select("*").eq("id", id).maybeSingle(), "get session");
    return data ? toSession(data) : null;
  }

  async ensureSession(id: string, now: string) {
    check(await this.db.from("sessions").upsert({ id, created_at: now, scenario_started_at: now, last_seen_at: now }, { onConflict: "id", ignoreDuplicates: true }), "create session");
    const s = await this.getSession(id);
    if (!s) throw new Error("create session: not found after insert");
    return s;
  }

  async updateSession(id: string, p: SessionPatch) {
    const row: Row = {};
    if (p.astronautId !== undefined) row.astronaut_id = p.astronautId;
    if (p.scenario !== undefined) row.scenario = p.scenario;
    if (p.scenarioTarget !== undefined) row.scenario_target = p.scenarioTarget;
    if (p.scenarioStartedAt !== undefined) row.scenario_started_at = p.scenarioStartedAt;
    if (p.earthLinkUp !== undefined) row.earth_link_up = p.earthLinkUp;
    if (p.sleepPeriod !== undefined) row.sleep_period = p.sleepPeriod;
    if (p.missionSetting !== undefined) row.mission_setting = p.missionSetting;
    if (p.lastSeenAt !== undefined) row.last_seen_at = p.lastSeenAt;
    check(await this.db.from("sessions").update(row).eq("id", id), "update session");
  }

  async deleteSession(id: string) {
    check(await this.db.from("sessions").delete().eq("id", id), "delete session");
  }

  async clearScenarioRows(id: string) {
    for (const t of ["entered_readings", "symptoms", "routine_events", "alert_events"] as const) check(await this.db.from(t).delete().eq("session_id", id), `clear ${t}`);
  }

  /** Six queries in parallel: one round trip to the database. Alert actions come through their alert's session. */
  private rowQueries(id: string) {
    return [
      this.db.from("entered_readings").select("*").eq("session_id", id).order("taken_at"),
      this.db.from("symptoms").select("*").eq("session_id", id).order("logged_at"),
      this.db.from("routine_events").select("*").eq("session_id", id).order("at"),
      this.db.from("alert_events").select("*").eq("session_id", id).order("opened_at"),
      this.db.from("alert_actions").select("id, alert_event_id, kind, note, at, alert_events!inner(session_id)").eq("alert_events.session_id", id).order("at"),
      this.db.from("reports").select("*").eq("session_id", id).order("queued_at"),
    ] as const;
  }

  private toRows(res: { data: unknown; error: { message: string } | null }[]): SessionRowsT {
    const [readings, symptoms, routine, alerts, actions, reports] = res.map((r, i) => (check(r, `load rows ${i}`) as Row[] | null) ?? []);
    return {
      readings: readings.map(toReading),
      symptoms: symptoms.map(toSymptom),
      routine: routine.map(toRoutine),
      alerts: alerts.map(toAlert),
      actions: actions.map(toAction),
      reports: reports.map(toReport),
    };
  }

  async loadRows(id: string): Promise<SessionRowsT> {
    return this.toRows(await Promise.all(this.rowQueries(id)));
  }

  async getSessionWithRows(id: string) {
    const [session, ...rows] = await Promise.all([this.db.from("sessions").select("*").eq("id", id).maybeSingle(), ...this.rowQueries(id)]);
    const s = check(session, "get session");
    return s ? { session: toSession(s), rows: this.toRows(rows) } : null;
  }

  async count(table: Table, sessionId: string) {
    if (table === "alert_actions") {
      const alerts = check(await this.db.from("alert_events").select("id").eq("session_id", sessionId), "count alerts") ?? [];
      if (!alerts.length) return 0;
      const res = await this.db.from("alert_actions").select("id", { head: true, count: "exact" }).in("alert_event_id", alerts.map((a) => a.id));
      check(res, "count actions");
      return res.count ?? 0;
    }
    const res = await this.db.from(table).select("id", { head: true, count: "exact" }).eq("session_id", sessionId);
    check(res, `count ${table}`);
    return res.count ?? 0;
  }

  async insertReading(sessionId: string, r: Omit<ReadingRowT, "id">) {
    const data = check(
      await this.db
        .from("entered_readings")
        .insert({ session_id: sessionId, astronaut_id: r.astronautId, indicator: r.indicator, value: r.value, value2: r.value2, context: r.context, pulse: r.pulse, stress: r.stress, tags: r.tags, note: r.note, device: r.device, task_id: r.taskId, taken_at: r.takenAt })
        .select()
        .single(),
      "insert reading",
    );
    return toReading(data);
  }

  async insertSymptom(sessionId: string, r: Omit<SymptomRowT, "id">) {
    const data = check(
      await this.db
        .from("symptoms")
        .insert({ session_id: sessionId, astronaut_id: r.astronautId, body_part: r.bodyPart, layer: r.layer, symptom: r.symptom, severity: r.severity, affects_work: r.affectsWork, note: r.note, started_at: r.startedAt, logged_at: r.loggedAt, resolved_at: r.resolvedAt })
        .select()
        .single(),
      "insert symptom",
    );
    return toSymptom(data);
  }

  async resolveSymptom(sessionId: string, rowId: number, at: string) {
    const data = check(await this.db.from("symptoms").update({ resolved_at: at }).eq("session_id", sessionId).eq("id", rowId).is("resolved_at", null).select("id"), "resolve symptom");
    return (data ?? []).length > 0;
  }

  async insertRoutine(sessionId: string, r: Omit<RoutineRowT, "id">) {
    const data = check(
      await this.db
        .from("routine_events")
        .insert({ session_id: sessionId, astronaut_id: r.astronautId, task_id: r.taskId, day: r.day, kind: r.kind, at: r.at, postponed_until: r.postponedUntil })
        .select()
        .single(),
      "insert routine event",
    );
    return toRoutine(data);
  }

  async insertAlert(sessionId: string, r: Omit<AlertRowT, "id">) {
    const row = { session_id: sessionId, astronaut_id: r.astronautId, indicator: r.indicator, severity: r.severity, opened_at: r.openedAt, acknowledged_at: r.acknowledgedAt, resolved_at: r.resolvedAt };
    // One query: insert, or on the same opening return the existing row.
    const data = check(await this.db.from("alert_events").upsert(row, { onConflict: "session_id,astronaut_id,indicator,opened_at" }).select().single(), "insert alert");
    return toAlert(data);
  }

  async updateAlert(sessionId: string, rowId: number, p: Partial<Pick<AlertRowT, "acknowledgedAt" | "resolvedAt" | "severity">>) {
    const row: Row = {};
    if (p.acknowledgedAt !== undefined) row.acknowledged_at = p.acknowledgedAt;
    if (p.resolvedAt !== undefined) row.resolved_at = p.resolvedAt;
    if (p.severity !== undefined) row.severity = p.severity;
    check(await this.db.from("alert_events").update(row).eq("session_id", sessionId).eq("id", rowId), "update alert");
  }

  async insertAction(sessionId: string, r: Omit<ActionRowT, "id">) {
    // The alert must belong to this session.
    const owner = check(await this.db.from("alert_events").select("id").eq("session_id", sessionId).eq("id", r.alertEventId).maybeSingle(), "check alert");
    if (!owner) throw new Error("insert action: alert not in session");
    const data = check(await this.db.from("alert_actions").insert({ alert_event_id: r.alertEventId, kind: r.kind, note: r.note, at: r.at }).select().single(), "insert action");
    return toAction(data);
  }

  async insertReport(sessionId: string, r: Omit<ReportRowT, "id">) {
    const data = check(
      await this.db
        .from("reports")
        .insert({ session_id: sessionId, astronaut_id: r.astronautId, urgency: r.urgency, note: r.note, summary: r.summary, queued_at: r.queuedAt, sent_at: r.sentAt })
        .select()
        .single(),
      "insert report",
    );
    return toReport(data);
  }

  async sendQueuedReports(sessionId: string, at: string) {
    check(await this.db.from("reports").update({ sent_at: at }).eq("session_id", sessionId).is("sent_at", null), "send reports");
  }
}
