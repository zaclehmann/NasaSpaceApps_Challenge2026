// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Shared types for MissionVitals. Plain TypeScript, no React.

/** The five status states (ui.md 3.2). */
export type Status = "ok" | "watch" | "caution" | "warning" | "nodata";

export const STATUSES: readonly Status[] = ["ok", "watch", "caution", "warning", "nodata"];

export const STATUS_WORD: Record<Status, string> = {
  ok: "In range",
  watch: "Watch",
  caution: "Caution",
  warning: "Warning",
  nodata: "No data",
};

/** Severity order used for "worst state wins" (ui.md 3.3 rule 4). */
export const STATUS_RANK: Record<Status, number> = {
  ok: 0,
  nodata: 1,
  watch: 2,
  caution: 3,
  warning: 4,
};

export function worstStatus(list: readonly Status[]): Status {
  let worst: Status = "ok";
  for (const s of list) if (STATUS_RANK[s] > STATUS_RANK[worst]) worst = s;
  return worst;
}

export type IndicatorKey = "hr" | "spo2" | "temp" | "bp" | "glucose" | "sleep" | "mood" | "radiation";

/** Where a reading comes from, which also sets the list group (ui.md 5.2). */
export type IndicatorSource = "live" | "entered" | "habitat";

export type ChartWindow = "1h" | "24h" | "7d" | "30d";

export type DeviceId = "shirt" | "cuff" | "glucometer" | "dosimeter" | "self";

export type GlucoseTiming = "fasting" | "before-meal" | "after-meal";

/** One reading. Time is mission elapsed time (MET) in seconds. */
export interface Reading {
  t: number;
  /** Primary value: systolic for blood pressure, 1 to 5 for mood. */
  value: number;
  /** Diastolic, for blood pressure only. */
  value2?: number;
  /** Pulse taken with a blood pressure reading. */
  pulse?: number;
  timing?: GlucoseTiming;
  /** Mood check-in only: stress 1 to 5, tags and an optional note. Private. */
  stress?: number;
  tags?: string[];
  note?: string;
  device: DeviceId;
}

export type Role = "Flight engineer" | "Commander" | "Crew medical officer";

export interface Astronaut {
  id: string;
  name: string;
  role: Role;
  /** The crew medical officer may see crewmates' mood answers. */
  isCmo: boolean;
}

export type ScenarioId =
  | "normal"
  | "hr-exercise"
  | "low-spo2"
  | "high-bp"
  | "mood-falling"
  | "sensor-dropout"
  | "solar-event";

export interface Scenario {
  id: ScenarioId;
  number: number;
  name: string;
  description: string;
}

export interface EarthLink {
  up: boolean;
  /** One-way light-time delay in seconds. */
  delaySec: number;
}

export interface Mission {
  name: string;
  /** Current MET in seconds. */
  met: number;
  earthLink: EarthLink;
  sleepPeriod: boolean;
  scenario: ScenarioId;
  /** The astronaut whose data the scenario changes. Radiation is crew-wide. */
  scenarioTarget: string;
}

export type RoutineKind = IndicatorKey | "exercise";

export interface RoutineTask {
  id: string;
  /** Minutes after midnight on the mission clock. */
  minute: number;
  label: string;
  kind: RoutineKind;
  procedureId: string;
}

export type TaskState =
  | { kind: "done"; at: number }
  | { kind: "due" }
  | { kind: "overdue"; minutes: number }
  | { kind: "upcoming" };

export interface RoutineEntry {
  task: RoutineTask;
  state: TaskState;
}

export interface RoutineSummary {
  entries: RoutineEntry[];
  done: number;
  total: number;
  streakDays: number;
  weekDone: number;
  weekTotal: number;
}

export type AlertActionKind = "remeasured" | "checked-sensor" | "contacted-cmo" | "note";

export interface AlertAction {
  t: number;
  kind: AlertActionKind;
  note?: string;
}

export interface Alert {
  id: string;
  astronautId: string;
  indicator: IndicatorKey;
  status: "caution" | "warning";
  /** MET when the indicator first crossed into this state. */
  firedAt: number;
  /** Plain explanation of the rule and the numbers that fired it. */
  rule: string;
  acknowledged: boolean;
  acknowledgedAt?: number;
  actions: AlertAction[];
}

export type Urgency = "routine" | "24h" | "urgent";

export interface ReportItem {
  indicator: IndicatorKey;
  status: Status;
  valueText: string;
}

export interface Report {
  id: string;
  astronautId: string;
  createdAt: number;
  urgency: Urgency;
  note: string;
  items: ReportItem[];
  actions: string[];
  /** queued: waiting for the link. in-transit: sent, not yet arrived. delivered: arrived on Earth. */
  state: "queued" | "in-transit" | "delivered";
  sentAt?: number;
  arrivesAt?: number;
}
