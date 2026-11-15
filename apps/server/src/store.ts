// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Storage for the API. Handlers only see this interface: Supabase in production (supabaseStore.ts), an in-memory
// copy in tests (memoryStore.ts). Every method is scoped to one session id, so sessions never see each other.
import type { ActionRowT, AlertRowT, ReadingRowT, ReportRowT, RoutineRowT, SessionInfoT, SessionRowsT, SymptomRowT } from "@missionvitals/shared";

export type Table = "entered_readings" | "symptoms" | "routine_events" | "alert_events" | "alert_actions" | "reports";

export interface SessionPatch {
  astronautId?: SessionInfoT["astronautId"];
  scenario?: SessionInfoT["scenario"];
  scenarioTarget?: SessionInfoT["scenarioTarget"];
  scenarioStartedAt?: string;
  earthLinkUp?: boolean;
  sleepPeriod?: boolean;
  missionSetting?: SessionInfoT["missionSetting"];
  lastSeenAt?: string;
}

export interface Store {
  /** True when the database answers. Never throws. */
  ping(): Promise<boolean>;
  getSession(id: string): Promise<SessionInfoT | null>;
  /** Creates the session if it doesn't exist yet; either way returns it. */
  ensureSession(id: string, now: string): Promise<SessionInfoT>;
  updateSession(id: string, patch: SessionPatch): Promise<void>;
  /** Deletes the session and, by cascade, every row it owns. */
  deleteSession(id: string): Promise<void>;
  /** Deletes what a scenario change resets: entered readings, symptoms, routine events, alerts and their actions. */
  clearScenarioRows(id: string): Promise<void>;
  loadRows(id: string): Promise<SessionRowsT>;
  count(table: Table, sessionId: string): Promise<number>;

  insertReading(sessionId: string, row: Omit<ReadingRowT, "id">): Promise<ReadingRowT>;
  insertSymptom(sessionId: string, row: Omit<SymptomRowT, "id">): Promise<SymptomRowT>;
  /** Sets resolved_at if the symptom belongs to the session and is still open. Returns false if not found. */
  resolveSymptom(sessionId: string, rowId: number, at: string): Promise<boolean>;
  insertRoutine(sessionId: string, row: Omit<RoutineRowT, "id">): Promise<RoutineRowT>;
  insertAlert(sessionId: string, row: Omit<AlertRowT, "id">): Promise<AlertRowT>;
  updateAlert(sessionId: string, rowId: number, patch: Partial<Pick<AlertRowT, "acknowledgedAt" | "resolvedAt" | "severity">>): Promise<void>;
  insertAction(sessionId: string, row: Omit<ActionRowT, "id">): Promise<ActionRowT>;
  insertReport(sessionId: string, row: Omit<ReportRowT, "id">): Promise<ReportRowT>;
  /** Marks every queued report of the session as sent at `at` (the Earth link came up). */
  sendQueuedReports(sessionId: string, at: string): Promise<void>;
}
