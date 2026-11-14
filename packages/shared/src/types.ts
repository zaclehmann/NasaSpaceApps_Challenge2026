// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Shared types for MissionVitals. Plain TypeScript, no React.

/**
 * The five status states (ui.md 3.2), plus "due": an entered measurement that is not taken yet
 * but is not late either. Due is neutral: plain text, no badge, no colour, and it never makes
 * a region or the overall status worse.
 */
export type Status = "ok" | "watch" | "caution" | "warning" | "nodata" | "due";

/** The five states with a badge, in legend order. */
export const STATUSES: readonly Status[] = ["ok", "watch", "caution", "warning", "nodata"];

export const STATUS_WORD: Record<Status, string> = {
  ok: "In range",
  watch: "Watch",
  caution: "Caution",
  warning: "Warning",
  nodata: "No data",
  due: "Due",
};

/** Severity order used for "worst state wins" (ui.md 3.3 rule 4). Due ranks with In range. */
export const STATUS_RANK: Record<Status, number> = {
  ok: 0,
  due: 0,
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

export type IndicatorKey = "hr" | "spo2" | "temp" | "bp" | "glucose" | "sleep" | "exercise" | "mood" | "radiation";

/** Where a reading comes from, which also sets the list group (ui.md 5.2). */
export type IndicatorSource = "live" | "entered" | "habitat";

export type ChartWindow = "1h" | "24h" | "7d" | "14d" | "30d";

export type DeviceId = "shirt" | "cuff" | "thermometer" | "glucometer" | "dosimeter" | "self";

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

/** Where the mission is. Changes only the mission name and the Earth link delay (simulated values). */
export type MissionSettingId = "mars-transit" | "station" | "lunar" | "mars-rover";

export interface MissionSetting {
  id: MissionSettingId;
  /** Shown in the Demo sheet. */
  label: string;
  /** Shown in the header. */
  missionName: string;
  /** One-way light-time delay to Earth, in seconds. */
  delaySec: number;
}

export interface Mission {
  name: string;
  setting: MissionSettingId;
  /** Current MET in seconds. */
  met: number;
  earthLink: EarthLink;
  sleepPeriod: boolean;
  scenario: ScenarioId;
  /** The astronaut whose data the scenario changes. Radiation is crew-wide. */
  scenarioTarget: string;
}

/** Every routine task records one indicator. */
export type RoutineKind = IndicatorKey;

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
  /** When the task is due today, after any postponement. */
  dueAt: number;
  /** True when the crew member pushed the task back from its scheduled time. */
  postponed: boolean;
}

export interface RoutineSummary {
  entries: RoutineEntry[];
  done: number;
  total: number;
  streakDays: number;
  weekDone: number;
  weekTotal: number;
}

/** "step": one step of the response checklist was done; the step text is in `note`. */
export type AlertActionKind = "remeasured" | "checked-sensor" | "contacted-cmo" | "note" | "step";

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
  /** Active symptoms in words, e.g. "Left knee: pain, 5 of 10, since day 141 09:00". For the flight surgeon only. */
  symptoms?: string[];
  /** queued: waiting for the link. in-transit: sent, not yet arrived. delivered: arrived on Earth. */
  state: "queued" | "in-transit" | "delivered";
  sentAt?: number;
  arrivesAt?: number;
}
