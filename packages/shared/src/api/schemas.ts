// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The API's wire format, shared by the server (apps/server, api/) and the web client (httpSource). Every request
// body and query is checked with these schemas; stored rows travel in the /state response in the same shape.
// Times on the wire are ISO wall-clock strings; both sides turn them into mission time with the session clock.
import { z } from "zod";
import { readingRangeError } from "../entryRanges";

export const SessionId = z.string().uuid({ message: "session must be a UUID" });
export const AstronautId = z.enum(["hana", "mira", "tomas"]);
export const IndicatorKeyZ = z.enum(["hr", "spo2", "temp", "bp", "glucose", "sleep", "exercise", "mood", "radiation"]);
export const EnteredIndicator = z.enum(["bp", "temp", "glucose", "sleep", "exercise", "mood"]);
export const ChartWindowZ = z.enum(["1h", "24h", "7d", "14d", "30d"]);
export const ScenarioIdZ = z.enum(["normal", "hr-exercise", "low-spo2", "high-bp", "mood-falling", "sensor-dropout", "solar-event"]);
export const MissionSettingIdZ = z.enum(["mars-transit", "station", "lunar", "mars-rover"]);
export const DeviceIdZ = z.enum(["shirt", "cuff", "thermometer", "glucometer", "dosimeter", "self"]);
export const BodyLayerZ = z.enum(["organs", "muscles", "skeleton"]);
export const AlertActionKindZ = z.enum(["remeasured", "checked-sensor", "contacted-cmo", "note", "step"]);
export const UrgencyZ = z.enum(["routine", "24h", "urgent"]);
const Iso = z.string().datetime({ offset: true });
const Note = z.string().max(500, { message: "note must be 500 characters or fewer" });
const ShortId = z.string().min(1).max(40);
/** Who is looking at the screen. The answer leaves out other astronauts' private rows unless this is the CMO. */
const Viewer = { viewer: z.enum(["hana", "mira", "tomas"]).nullable().optional() };

/* ---------- requests ---------- */

export const SessionRequest = z.object({ id: SessionId }).strict();
export const StateQuery = z.object({ session: SessionId, astronaut: AstronautId.optional() });

export const ReadingRequest = z
  .object({
    ...Viewer,
    session: SessionId,
    astronaut: AstronautId,
    indicator: EnteredIndicator,
    value: z.number().finite(),
    value2: z.number().finite().optional(),
    pulse: z.number().finite().optional(),
    timing: z.enum(["fasting", "before-meal", "after-meal"]).optional(),
    stress: z.number().int().min(1).max(5).optional(),
    tags: z.array(z.string().max(40)).max(10).optional(),
    note: Note.optional(),
    device: DeviceIdZ,
    taskId: ShortId.optional(),
    /** When it was taken (wall clock, from the session clock). The server keeps it within the last 10 minutes. */
    takenAt: Iso.optional(),
  })
  .strict()
  // The same entry ranges and words as the forms (entryRanges.ts): "value: Systolic must be between 60 and 250 mmHg".
  .superRefine((r, ctx) => {
    const e = readingRangeError(r.indicator, r);
    if (e) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [e.field], message: e.message });
  });

export const SymptomRequest = z
  .object({
    ...Viewer,
    session: SessionId,
    astronaut: AstronautId,
    partId: ShortId,
    layer: BodyLayerZ,
    kind: ShortId,
    severity: z.number().int().min(0).max(10),
    /** MET seconds when it started, as the app shows it. */
    startedAt: z.number().finite(),
    affectsWork: z.boolean(),
    note: Note.optional(),
    /** When it was logged (wall clock). The server keeps it within the last 10 minutes. */
    loggedAt: Iso.optional(),
  })
  .strict();
export const ResolveSymptomRequest = z.object({ ...Viewer, session: SessionId }).strict();

export const RoutineRequest = z.object({ ...Viewer, session: SessionId, astronaut: AstronautId, taskId: ShortId }).strict();
export const PostponeRequest = RoutineRequest.extend({ minutes: z.number().int().min(1).max(24 * 60) }).strict();

export const AcknowledgeRequest = z.object({ ...Viewer, session: SessionId }).strict();
export const AlertActionRequest = z.object({ ...Viewer, session: SessionId, kind: AlertActionKindZ, note: Note.optional() }).strict();

export const ReportRequest = z
  .object({
    ...Viewer,
    session: SessionId,
    astronaut: AstronautId,
    urgency: UrgencyZ,
    note: Note,
    items: z.array(z.object({ indicator: IndicatorKeyZ, status: z.enum(["ok", "watch", "caution", "warning", "nodata", "due"]), valueText: z.string().max(60) })).max(20),
    actions: z.array(z.string().max(200)).max(30),
    symptoms: z.array(z.string().max(200)).max(30).optional(),
  })
  .strict();

export const DemoRequest = z
  .object({
    ...Viewer,
    session: SessionId,
    scenario: ScenarioIdZ.optional(),
    target: AstronautId.optional(),
    earthLinkUp: z.boolean().optional(),
    sleepPeriod: z.boolean().optional(),
    missionSetting: MissionSettingIdZ.optional(),
    astronaut: AstronautId.nullable().optional(),
    reset: z.literal(true).optional(),
  })
  .strict();

/* ---------- stored rows, as sent in /state ---------- */

export const SessionInfo = z.object({
  id: SessionId,
  createdAt: Iso,
  astronautId: AstronautId.nullable(),
  scenario: ScenarioIdZ,
  scenarioTarget: AstronautId,
  scenarioStartedAt: Iso,
  earthLinkUp: z.boolean(),
  sleepPeriod: z.boolean(),
  missionSetting: MissionSettingIdZ,
  /** When the session last made a request; written at most once a minute. */
  lastSeenAt: Iso.optional(),
});

export const ReadingRow = z.object({
  id: z.number(),
  astronautId: AstronautId,
  indicator: EnteredIndicator,
  value: z.number(),
  value2: z.number().nullable(),
  context: z.enum(["fasting", "before-meal", "after-meal"]).nullable(),
  pulse: z.number().nullable(),
  stress: z.number().nullable(),
  tags: z.array(z.string()).nullable(),
  note: z.string().nullable(),
  device: DeviceIdZ,
  taskId: z.string().nullable(),
  takenAt: Iso,
});
/**
 * A symptom row. For a crewmate's symptom sent to someone who isn't the crew medical officer it is `hidden`:
 * body part, symptom, severity, note, start and "affects work" are null, and `level` carries its status.
 */
export const SymptomRow = z.object({
  id: z.number(),
  astronautId: AstronautId,
  bodyPart: z.string().nullable(),
  layer: BodyLayerZ.nullable(),
  symptom: z.string().nullable(),
  severity: z.number().nullable(),
  affectsWork: z.boolean().nullable(),
  note: z.string().nullable(),
  startedAt: Iso.nullable(),
  loggedAt: Iso,
  resolvedAt: Iso.nullable(),
  hidden: z.boolean().optional(),
  level: z.enum(["watch", "caution", "warning"]).nullable().optional(),
});
export const RoutineRow = z.object({
  id: z.number(),
  astronautId: AstronautId,
  taskId: z.string(),
  day: z.string(),
  kind: z.enum(["completed", "postponed"]),
  at: Iso,
  postponedUntil: Iso.nullable(),
});
export const AlertRow = z.object({
  id: z.number(),
  astronautId: AstronautId,
  indicator: IndicatorKeyZ,
  severity: z.enum(["caution", "warning"]),
  openedAt: Iso,
  acknowledgedAt: Iso.nullable(),
  resolvedAt: Iso.nullable(),
});
export const ActionRow = z.object({ id: z.number(), alertEventId: z.number(), kind: AlertActionKindZ, note: z.string().nullable(), at: Iso });
export const ReportRow = z.object({
  id: z.number(),
  astronautId: AstronautId,
  urgency: UrgencyZ,
  note: z.string().nullable(),
  summary: z.object({ items: ReportRequest.shape.items, actions: ReportRequest.shape.actions, symptoms: ReportRequest.shape.symptoms }),
  queuedAt: Iso,
  sentAt: Iso.nullable(),
});

export const SessionRows = z.object({
  readings: z.array(ReadingRow),
  symptoms: z.array(SymptomRow),
  routine: z.array(RoutineRow),
  alerts: z.array(AlertRow),
  actions: z.array(ActionRow),
  reports: z.array(ReportRow),
});

/* ---------- responses ---------- */

export const HealthResponse = z.object({ ok: z.boolean(), db: z.enum(["up", "down"]), time: Iso });
export const StateResponse = z.object({
  /** Server wall-clock time of this answer; the client runs the session clock on from here. */
  serverTime: Iso,
  nowMet: z.number(),
  session: SessionInfo,
  rows: SessionRows,
  /** The computed screen state, the same shape the DataSource returns (for API users and the smoke test). */
  view: z.record(z.unknown()),
});
export const ErrorResponse = z.object({ error: z.string() });

export type SessionInfoT = z.infer<typeof SessionInfo>;
export type SessionRowsT = z.infer<typeof SessionRows>;
export type ReadingRowT = z.infer<typeof ReadingRow>;
export type SymptomRowT = z.infer<typeof SymptomRow>;
export type RoutineRowT = z.infer<typeof RoutineRow>;
export type AlertRowT = z.infer<typeof AlertRow>;
export type ActionRowT = z.infer<typeof ActionRow>;
export type ReportRowT = z.infer<typeof ReportRow>;
export type StateResponseT = z.infer<typeof StateResponse>;
export type HealthResponseT = z.infer<typeof HealthResponse>;
