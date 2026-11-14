// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The one interface all data goes through. Components never import the mock directly;
// a Node API client can implement this later (keeping a local cache and calling subscribers on change).
import type {
  Alert,
  AlertActionKind,
  Astronaut,
  ChartWindow,
  IndicatorKey,
  Mission,
  Reading,
  Report,
  ReportItem,
  RoutineSummary,
  ScenarioId,
  Urgency,
} from "@missionvitals/shared";

export interface NewReport {
  urgency: Urgency;
  note: string;
  items: ReportItem[];
  actions: string[];
}

export interface DataSource {
  getCrew(): Astronaut[];
  getMission(): Mission;
  /** Readings in time order, oldest first. Missing data is a gap, never a filled-in value. */
  getReadings(astronautId: string, indicator: IndicatorKey, window: ChartWindow): Reading[];
  /** Calls back whenever any data changes. Returns an unsubscribe function. */
  subscribe(callback: () => void): () => void;
  addReading(astronautId: string, indicator: IndicatorKey, reading: Omit<Reading, "t">, taskId?: string): Reading;
  getRoutine(astronautId: string): RoutineSummary;
  completeTask(astronautId: string, taskId: string): void;
  getAlerts(astronautId: string): Alert[];
  acknowledgeAlert(alertId: string): void;
  logAction(alertId: string, kind: AlertActionKind, note?: string): void;
  queueReport(astronautId: string, report: NewReport): Report;
  getDownlinkQueue(): Report[];
  setScenario(scenario: ScenarioId, astronautId: string): void;
  setEarthLink(up: boolean): void;
  setSleepPeriod(on: boolean): void;
}
