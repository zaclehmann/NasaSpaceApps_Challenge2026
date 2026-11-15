// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The API, as plain functions: (input, ctx) => result. No HTTP objects here, so they are easy to test; the router
// (router.ts) maps paths to them. Every function works inside one session and checks its input with the shared
// zod schemas. Statuses and alerts come from the shared session engine, rebuilt from the session's stored rows.
import {
  AcknowledgeRequest,
  AlertActionRequest,
  DemoRequest,
  INDICATORS,
  ReadingRequest,
  ReportRequest,
  ResolveSymptomRequest,
  RoutineRequest,
  PostponeRequest,
  SESSION_CREW,
  SessionRequest,
  StateQuery,
  SymptomRequest,
  rebuildSession,
  sessionClock,
  type AlertRowT,
  type HealthResponseT,
  type SessionInfoT,
  type SessionRowsT,
  type StateResponseT,
} from "@missionvitals/shared";
import type { z, ZodTypeAny } from "zod";
import { ApiError, badRequest, notFound, zodMessage } from "./errors";
import type { Store, Table } from "./store";

export interface Ctx {
  store: Store;
  /** Wall-clock now as ISO; injected so tests can move time. */
  now: () => string;
}

/** Rows per session per table. */
export const ROW_CAP = 500;

/** How far back and ahead a client-sent action time may be: it's clamped into this window around now. */
export const ACTION_TIME_PAST_MS = 10 * 60 * 1000;
export const ACTION_TIME_FUTURE_MS = 5 * 1000;

/**
 * The time an action happened, as the browser sent it, kept within [now - 10 min, now + 5 s]. Using the
 * browser's time (not the moment the request arrived) gives browser and server the same alert ids and fire times.
 */
export function actionTime(sent: string | undefined, now: string): string {
  const n = Date.parse(now);
  if (!sent) return now;
  const t = Math.min(n + ACTION_TIME_FUTURE_MS, Math.max(n - ACTION_TIME_PAST_MS, Date.parse(sent)));
  return new Date(t).toISOString();
}

function parse<S extends ZodTypeAny>(schema: S, input: unknown): z.infer<S> {
  const r = schema.safeParse(input);
  if (!r.success) throw badRequest(zodMessage(r.error));
  return r.data;
}

type Loaded = { session: SessionInfoT; rows: SessionRowsT };

/** The session and all its rows, in one round of parallel queries. */
async function load(ctx: Ctx, sessionId: string): Promise<Loaded> {
  const loaded = await ctx.store.getSessionWithRows(sessionId);
  if (!loaded) throw notFound("Unknown session. Open the app (GET /api/state) or POST /api/session first.");
  return loaded;
}

const ROWS_OF: Record<Table, keyof SessionRowsT> = {
  entered_readings: "readings",
  symptoms: "symptoms",
  routine_events: "routine",
  alert_events: "alerts",
  alert_actions: "actions",
  reports: "reports",
};

/** The 500-row cap, counted from the rows already loaded (no count query). */
function capped(loaded: Loaded, table: Table) {
  if (loaded.rows[ROWS_OF[table]].length >= ROW_CAP) throw new ApiError(429, `This demo session has reached its limit of ${ROW_CAP} ${table.replace("_", " ")}. Reset the demo to start again.`);
}

/** last_seen_at, written at most once a minute so polls don't write every 5 seconds. */
async function touch(ctx: Ctx, session: SessionInfoT) {
  const now = ctx.now();
  if (session.lastSeenAt && Date.parse(now) - Date.parse(session.lastSeenAt) < 60_000) return;
  await ctx.store.updateSession(session.id, { lastSeenAt: now }).catch(() => undefined);
}

/**
 * Saves alert openings, closings and level changes. An open alert is matched to the unresolved row for the same
 * astronaut and indicator; a new one is inserted; a row whose alert has closed gets resolved_at. Returns fresh rows.
 */
async function persistAlerts(ctx: Ctx, session: SessionInfoT, rows: SessionRowsT, engine: ReturnType<typeof rebuildSession>["engine"], wall: (met: number) => string): Promise<AlertRowT[]> {
  const now = ctx.now();
  const out = [...rows.alerts];
  const open = SESSION_CREW.flatMap((a) => engine.getAlerts(a.id));
  for (const a of open) {
    const row = out.find((r) => r.astronautId === a.astronautId && r.indicator === a.indicator && !r.resolvedAt);
    if (!row) {
      if (out.length >= ROW_CAP) continue;
      const created = await ctx.store.insertAlert(session.id, { astronautId: a.astronautId as AlertRowT["astronautId"], indicator: a.indicator, severity: a.status, openedAt: wall(Math.round(a.firedAt)), acknowledgedAt: null, resolvedAt: null });
      if (!out.some((r) => r.id === created.id)) out.push(created);
    } else if (row.severity !== a.status) {
      // A change of level is a new event: a Warning needs a new acknowledgement.
      const patch = { severity: a.status, ...(a.status === "warning" && { acknowledgedAt: null }) };
      await ctx.store.updateAlert(session.id, row.id, patch);
      Object.assign(row, patch);
    }
  }
  for (const row of out) {
    if (row.resolvedAt) continue;
    if (!open.some((a) => a.astronautId === row.astronautId && a.indicator === row.indicator)) {
      await ctx.store.updateAlert(session.id, row.id, { resolvedAt: now });
      row.resolvedAt = now;
    }
  }
  return out;
}

/** May this viewer see this astronaut's private data (symptoms, mood)? The app's rule: themselves, or the CMO. */
function canSee(viewer: string | null | undefined, astronautId: string): boolean {
  if (!viewer) return false;
  return viewer === astronautId || (SESSION_CREW.find((a) => a.id === viewer)?.isCmo ?? false);
}

/**
 * The rows this viewer may receive, unless the viewer is the crew medical officer: other astronauts' symptoms are
 * left out, their mood check-ins lose the private fields (stress, tags, note), and their reports lose the
 * symptoms line. The mood value stays, for their overall status; the screen shows their mood as Private.
 */
function rowsFor(rows: SessionRowsT, viewer: string | null | undefined): SessionRowsT {
  return {
    ...rows,
    readings: rows.readings.map((r) => (r.indicator !== "mood" || canSee(viewer, r.astronautId) ? r : { ...r, stress: null, tags: null, note: null })),
    symptoms: rows.symptoms.filter((s) => canSee(viewer, s.astronautId)),
    reports: rows.reports.map((r) => (canSee(viewer, r.astronautId) ? r : { ...r, summary: { items: r.summary.items, actions: r.summary.actions } })),
  };
}

/**
 * Rebuild the session, save alert changes (only when one opens, changes level or closes), and return what the
 * screen needs. Takes the session as already loaded, so a write doesn't load everything again.
 */
async function stateOf(ctx: Ctx, loaded: Loaded, viewer?: string | null): Promise<StateResponseT> {
  const { session, rows } = loaded;
  const serverTime = ctx.now();
  const rebuilt = rebuildSession(session, rows, serverTime);
  const alerts = await persistAlerts(ctx, session, rows, rebuilt.engine, rebuilt.clock.wall);
  const e = rebuilt.engine;
  const view = {
    crew: e.getCrew(),
    mission: e.getMission(),
    astronauts: Object.fromEntries(
      SESSION_CREW.map((a) => {
        // Privacy, as in the app: symptoms and mood only for the astronaut themselves and the crew medical officer.
        const open = canSee(viewer, a.id);
        const indicators = Object.fromEntries(
          Object.keys(INDICATORS)
            .filter((k) => open || k !== "mood")
            .map((k) => {
              const ev = e.evaluateIndicator(a.id, k as keyof typeof INDICATORS);
              return [k, { status: ev.status, reason: ev.reason, value: ev.latest?.value ?? null, value2: ev.latest?.value2 ?? null, at: ev.latest?.t ?? null, since: ev.since ?? null }];
            }),
        );
        return [a.id, { indicators, routine: e.getRoutine(a.id), alerts: e.getAlerts(a.id), symptoms: open ? e.getSymptoms(a.id) : [], exerciseSoFar: e.getExerciseSoFar(a.id) }];
      }),
    ),
    downlink: e.getDownlinkQueue(),
    solarEvents: e.getSolarEvents(),
  };
  return { serverTime, nowMet: rebuilt.nowMet, session, rows: rowsFor({ ...rows, alerts }, viewer), view };
}

/* ---------- endpoints ---------- */

export async function health(ctx: Ctx): Promise<HealthResponseT> {
  let up = false;
  try {
    up = await ctx.store.ping();
  } catch {
    up = false;
  }
  return { ok: true, db: up ? "up" : "down", time: ctx.now() };
}

export async function createSession(ctx: Ctx, body: unknown): Promise<SessionInfoT> {
  const { id } = parse(SessionRequest, body);
  const s = await ctx.store.ensureSession(id, ctx.now());
  await ctx.store.updateSession(id, { lastSeenAt: ctx.now() });
  return s;
}

/** The screen state. Creates the session if it doesn't exist yet, so opening the app is one request. */
export async function getState(ctx: Ctx, query: unknown): Promise<StateResponseT> {
  const q = parse(StateQuery, query);
  let loaded = await ctx.store.getSessionWithRows(q.session);
  if (!loaded) loaded = { session: await ctx.store.ensureSession(q.session, ctx.now()), rows: { readings: [], symptoms: [], routine: [], alerts: [], actions: [], reports: [] } };
  const [state] = await Promise.all([stateOf(ctx, loaded, q.astronaut), touch(ctx, loaded.session)]);
  return state;
}

export async function postReading(ctx: Ctx, body: unknown) {
  const b = parse(ReadingRequest, body);
  const loaded = await load(ctx, b.session);
  capped(loaded, "entered_readings");
  const row = await ctx.store.insertReading(b.session, {
    astronautId: b.astronaut,
    indicator: b.indicator,
    value: b.value,
    value2: b.value2 ?? null,
    context: b.timing ?? null,
    pulse: b.pulse ?? null,
    stress: b.stress ?? null,
    tags: b.tags ?? null,
    note: b.note ?? null,
    device: b.device,
    taskId: b.taskId ?? null,
    takenAt: actionTime(b.takenAt, ctx.now()),
  });
  loaded.rows.readings.push(row);
  const state = await stateOf(ctx, loaded, b.viewer);
  const ind = (state.view.astronauts as Record<string, { indicators: Record<string, { status: string }>; alerts: { id: string; indicator: string; status: string; acknowledged: boolean }[] }>)[b.astronaut];
  return { reading: row, status: ind.indicators[b.indicator]?.status ?? null, alert: ind.alerts.find((a) => a.indicator === b.indicator) ?? null, state };
}

export async function postSymptom(ctx: Ctx, body: unknown) {
  const b = parse(SymptomRequest, body);
  const loaded = await load(ctx, b.session);
  capped(loaded, "symptoms");
  const { session } = loaded;
  // The app gives the start in mission time; store it as wall time on the session clock, never in the future.
  const startedWall = new Date(Math.min(Date.parse(ctx.now()), Date.parse(sessionClock(session.createdAt).wall(b.startedAt)))).toISOString();
  const row = await ctx.store.insertSymptom(b.session, {
    astronautId: b.astronaut,
    bodyPart: b.partId,
    layer: b.layer,
    symptom: b.kind,
    severity: b.severity,
    affectsWork: b.affectsWork,
    note: b.note ?? null,
    startedAt: startedWall,
    loggedAt: actionTime(b.loggedAt, ctx.now()),
    resolvedAt: null,
  });
  loaded.rows.symptoms.push(row);
  return { symptom: row, state: await stateOf(ctx, loaded, b.viewer) };
}

/** `id` is the symptom's id as the app shows it ("sym-db-12") or the bare row number. */
export async function resolveSymptom(ctx: Ctx, id: string, body: unknown) {
  const b = parse(ResolveSymptomRequest, body);
  const rowId = Number(id.replace(/^sym-db-/, ""));
  if (!Number.isInteger(rowId) || rowId <= 0) throw badRequest("id: not a symptom id");
  const loaded = await load(ctx, b.session);
  const now = ctx.now();
  if (!(await ctx.store.resolveSymptom(b.session, rowId, now))) throw notFound("No open symptom with that id in this session.");
  const sym = loaded.rows.symptoms.find((x) => x.id === rowId);
  if (sym) sym.resolvedAt = now;
  return { state: await stateOf(ctx, loaded, b.viewer) };
}

async function routineEvent(ctx: Ctx, body: unknown, kind: "completed" | "postponed") {
  const b = kind === "completed" ? parse(RoutineRequest, body) : parse(PostponeRequest, body);
  const loaded = await load(ctx, b.session);
  capped(loaded, "routine_events");
  const now = ctx.now();
  const minutes = "minutes" in b ? Number(b.minutes) : 0;
  const row = await ctx.store.insertRoutine(b.session, {
    astronautId: b.astronaut,
    taskId: b.taskId,
    day: now.slice(0, 10),
    kind,
    at: now,
    postponedUntil: kind === "postponed" ? new Date(Date.parse(now) + minutes * 60_000).toISOString() : null,
  });
  loaded.rows.routine.push(row);
  return { state: await stateOf(ctx, loaded, b.viewer) };
}
export const completeTask = (ctx: Ctx, body: unknown) => routineEvent(ctx, body, "completed");
export const postponeTask = (ctx: Ctx, body: unknown) => routineEvent(ctx, body, "postponed");

/** The open alert with the app's id, and its stored row (saved first if it's new). */
async function alertRow(ctx: Ctx, loaded: Loaded, alertId: string): Promise<AlertRowT> {
  const state = await stateOf(ctx, loaded);
  // stateOf may have saved a new alert row: keep the loaded copy in step.
  loaded.rows.alerts = state.rows.alerts;
  const all = Object.values(state.view.astronauts as Record<string, { alerts: { id: string; astronautId: string; indicator: string }[] }>).flatMap((a) => a.alerts);
  // The id carries the fire time. If it differs slightly (an older client), fall back to the open alert for the
  // same astronaut and indicator, which the id starts with: "<astronaut>-<indicator>-<time>".
  const prefix = /^([a-z]+)-([a-z0-9]+)-/.exec(alertId);
  const alert = all.find((a) => a.id === alertId) ?? (prefix ? all.find((a) => a.astronautId === prefix[1] && a.indicator === prefix[2]) : undefined);
  if (!alert) throw notFound("No open alert with that id in this session.");
  const row = state.rows.alerts.find((r) => r.astronautId === alert.astronautId && r.indicator === alert.indicator && !r.resolvedAt);
  if (!row) throw new Error("open alert has no stored row");
  return row;
}

export async function acknowledgeAlert(ctx: Ctx, alertId: string, body: unknown) {
  const b = parse(AcknowledgeRequest, body);
  const loaded = await load(ctx, b.session);
  const row = await alertRow(ctx, loaded, alertId);
  if (!row.acknowledgedAt) {
    row.acknowledgedAt = ctx.now();
    await ctx.store.updateAlert(b.session, row.id, { acknowledgedAt: row.acknowledgedAt });
  }
  return { state: await stateOf(ctx, loaded, b.viewer) };
}

export async function logAlertAction(ctx: Ctx, alertId: string, body: unknown) {
  const b = parse(AlertActionRequest, body);
  const loaded = await load(ctx, b.session);
  capped(loaded, "alert_actions");
  const row = await alertRow(ctx, loaded, alertId);
  loaded.rows.actions.push(await ctx.store.insertAction(b.session, { alertEventId: row.id, kind: b.kind, note: b.note ?? null, at: ctx.now() }));
  return { state: await stateOf(ctx, loaded, b.viewer) };
}

export async function queueReport(ctx: Ctx, body: unknown) {
  const b = parse(ReportRequest, body);
  const loaded = await load(ctx, b.session);
  capped(loaded, "reports");
  const { session } = loaded;
  const now = ctx.now();
  const row = await ctx.store.insertReport(b.session, {
    astronautId: b.astronaut,
    urgency: b.urgency,
    note: b.note,
    summary: { items: b.items, actions: b.actions, ...(b.symptoms && { symptoms: b.symptoms }) },
    queuedAt: now,
    sentAt: session.earthLinkUp ? now : null,
  });
  loaded.rows.reports.push(row);
  return { report: row, state: await stateOf(ctx, loaded, b.viewer) };
}

export async function demo(ctx: Ctx, body: unknown) {
  const b = parse(DemoRequest, body);
  if (b.reset) {
    await ctx.store.deleteSession(b.session);
    return { reset: true };
  }
  const session = await ctx.store.getSession(b.session);
  if (!session) throw notFound("Unknown session. Open the app (GET /api/state) or POST /api/session first.");
  const now = ctx.now();
  // One update for all the settings in this request.
  const patch: Parameters<Ctx["store"]["updateSession"]>[1] = {};
  if (b.scenario !== undefined) Object.assign(patch, { scenario: b.scenario, scenarioTarget: b.target ?? session.scenarioTarget, scenarioStartedAt: now });
  if (b.earthLinkUp !== undefined) patch.earthLinkUp = b.earthLinkUp;
  if (b.sleepPeriod !== undefined) patch.sleepPeriod = b.sleepPeriod;
  if (b.missionSetting !== undefined) patch.missionSetting = b.missionSetting;
  if (b.astronaut !== undefined) patch.astronautId = b.astronaut;
  await Promise.all([
    // As in the app: choosing a scenario resets entered readings, symptoms, the routine and alerts.
    b.scenario !== undefined ? ctx.store.clearScenarioRows(b.session) : undefined,
    Object.keys(patch).length ? ctx.store.updateSession(b.session, patch) : undefined,
    b.earthLinkUp ? ctx.store.sendQueuedReports(b.session, now) : undefined,
  ]);
  return { state: await stateOf(ctx, await load(ctx, b.session), b.viewer) };
}
