// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Rebuilds a session's SessionEngine from its settings and stored rows, on the session's own mission clock.
// The server does this for every request; the web client (server mode) does it with the rows /state returns,
// so both compute statuses and alerts with the same code from the same data.
//
// The session clock: MET 141d 14:33 at the moment the session was created, running at wall-clock speed.
// Events replay in time order with the clock set to each event's time, so routine, alerts and the
// "re-measured" log come out exactly as they did live.
import { MISSION_SETTINGS } from "../scenarios";
import { CREW, MET_AT_LOAD, SessionEngine } from "../sim";
import type { Report } from "../types";
import type { SessionInfoT, SessionRowsT } from "./schemas";

export interface SessionClock {
  /** Mission time (MET seconds) of a wall-clock ISO time. */
  met: (iso: string) => number;
  /** Wall-clock ISO time of a mission time. */
  wall: (met: number) => string;
}

export function sessionClock(createdAt: string): SessionClock {
  const created = Date.parse(createdAt);
  return {
    met: (iso) => MET_AT_LOAD + (Date.parse(iso) - created) / 1000,
    wall: (met) => new Date(created + (met - MET_AT_LOAD) * 1000).toISOString(),
  };
}

/** Symptom ids derived from stored rows, the same on both sides. */
export const symptomIdOf = (rowId: number) => `sym-db-${rowId}`;
export const reportIdOf = (rowId: number) => `report-db-${rowId}`;

const DEFAULT_SCENARIO = { scenario: "hr-exercise", target: "hana" } as const;

export interface Rebuilt {
  engine: SessionEngine;
  clock: SessionClock;
  nowMet: number;
  /** Moves the engine's clock (for applying a new action at "now" after the rebuild). */
  setNow: (met: number) => void;
}

export function rebuildSession(session: SessionInfoT, rows: SessionRowsT, nowWall: string): Rebuilt {
  const clock = sessionClock(session.createdAt);
  let t = MET_AT_LOAD;
  const engine = new SessionEngine(() => t);
  const nowMet = Math.max(MET_AT_LOAD, clock.met(nowWall));

  // Scenario: a new session starts on the default scenario at load, exactly like the in-browser mock.
  const anchor = clock.met(session.scenarioStartedAt);
  if (session.scenario !== DEFAULT_SCENARIO.scenario || session.scenarioTarget !== DEFAULT_SCENARIO.target || anchor >= MET_AT_LOAD + 5) {
    t = Math.max(MET_AT_LOAD, anchor);
    engine.setScenario(session.scenario, session.scenarioTarget);
  }
  engine.setMissionSetting(session.missionSetting);
  engine.setSleepPeriod(session.sleepPeriod);

  // Everything the astronaut did, in time order. Acknowledgements and actions first move the alerts on to
  // their moment, so they land on the alert that was open then.
  type Step = { t: number; order: number; run: () => void };
  const steps: Step[] = [];
  const at = (iso: string) => clock.met(iso);
  const activeAlert = (astronautId: string, indicator: string) => engine.getAlerts(astronautId).find((a) => a.indicator === indicator);

  for (const r of rows.readings) {
    steps.push({
      t: at(r.takenAt),
      order: 1,
      run: () =>
        engine.addReading(
          r.astronautId,
          r.indicator,
          {
            value: r.value,
            ...(r.value2 !== null && { value2: r.value2 }),
            ...(r.pulse !== null && { pulse: r.pulse }),
            ...(r.context !== null && { timing: r.context }),
            ...(r.stress !== null && { stress: r.stress }),
            ...(r.tags !== null && { tags: r.tags }),
            ...(r.note !== null && { note: r.note }),
            device: r.device,
          },
          r.taskId ?? undefined,
        ),
    });
  }
  for (const r of rows.routine) {
    steps.push({
      t: at(r.at),
      order: 2,
      run: () =>
        r.kind === "completed" ? engine.completeTask(r.astronautId, r.taskId) : engine.postponeTask(r.astronautId, r.taskId, Math.max(1, Math.round((at(r.postponedUntil ?? r.at) - at(r.at)) / 60))),
    });
  }
  for (const s of rows.symptoms) {
    steps.push({
      t: at(s.loggedAt),
      order: 3,
      run: () => engine.addSymptom(s.astronautId, { partId: s.bodyPart, layer: s.layer, kind: s.symptom, severity: s.severity, startedAt: at(s.startedAt), affectsWork: s.affectsWork, ...(s.note !== null && { note: s.note }) }, symptomIdOf(s.id)),
    });
    if (s.resolvedAt) steps.push({ t: at(s.resolvedAt), order: 4, run: () => engine.resolveSymptom(symptomIdOf(s.id)) });
  }
  const alertById = new Map(rows.alerts.map((a) => [a.id, a]));
  for (const a of rows.alerts) {
    if (!a.acknowledgedAt) continue;
    steps.push({
      t: at(a.acknowledgedAt),
      order: 5,
      run: () => {
        engine.tick();
        const open = activeAlert(a.astronautId, a.indicator);
        if (open) engine.acknowledgeAlert(open.id);
      },
    });
  }
  for (const x of rows.actions) {
    const a = alertById.get(x.alertEventId);
    if (!a) continue;
    steps.push({
      t: at(x.at),
      order: 6,
      run: () => {
        engine.tick();
        const open = activeAlert(a.astronautId, a.indicator);
        if (open) engine.logAction(open.id, x.kind, x.note ?? undefined);
      },
    });
  }
  steps.sort((a, b) => a.t - b.t || a.order - b.order);
  for (const s of steps) {
    t = Math.max(MET_AT_LOAD, Math.min(s.t, nowMet));
    s.run();
  }

  // Reports: the stored queue, moved on by the clock and the Earth link delay.
  t = nowMet;
  const delay = (MISSION_SETTINGS.find((m) => m.id === session.missionSetting) ?? MISSION_SETTINGS[0]).delaySec;
  const reports: Report[] = rows.reports.map((r) => {
    const sent = r.sentAt ? at(r.sentAt) : undefined;
    return {
      id: reportIdOf(r.id),
      astronautId: r.astronautId,
      createdAt: at(r.queuedAt),
      urgency: r.urgency,
      note: r.note ?? "",
      items: r.summary.items,
      actions: r.summary.actions,
      ...(r.summary.symptoms && { symptoms: r.summary.symptoms }),
      state: sent === undefined ? "queued" : "in-transit",
      ...(sent !== undefined && { sentAt: sent, arrivesAt: sent + delay }),
    };
  });
  engine.setEarthLink(session.earthLinkUp);
  engine.loadReports(reports);
  engine.tick();

  return {
    engine,
    clock,
    nowMet,
    setNow: (met: number) => {
      t = met;
    },
  };
}

/** The crew list, so callers don't need the simulator import. */
export const SESSION_CREW = CREW;
