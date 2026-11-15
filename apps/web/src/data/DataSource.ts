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
  ReplayedEvent,
  MissionSettingId,
  NewReport,
  NewSymptom,
  Reading,
  Report,
  RoutineSummary,
  ScenarioId,
  Symptom,
} from "@missionvitals/shared";

export type { NewReport } from "@missionvitals/shared";

export interface DataSource {
  getCrew(): Astronaut[];
  getMission(): Mission;
  /** Readings in time order, oldest first. Missing data is a gap, never a filled-in value. */
  getReadings(astronautId: string, indicator: IndicatorKey, window: ChartWindow): Reading[];
  /** Exercise minutes the shirt has counted so far today, before the astronaut confirms the day's total. */
  getExerciseSoFar(astronautId: string): number;
  /** Calls back whenever any data changes. Returns an unsubscribe function. */
  subscribe(callback: () => void): () => void;
  addReading(astronautId: string, indicator: IndicatorKey, reading: Omit<Reading, "t">, taskId?: string): Reading;
  getRoutine(astronautId: string): RoutineSummary;
  completeTask(astronautId: string, taskId: string): void;
  /** Push a due task back to `minutes` from now (POSTPONE_MIN by default). */
  postponeTask(astronautId: string, taskId: string, minutes?: number): void;
  /** Every symptom this astronaut has logged, newest first, resolved ones included. */
  getSymptoms(astronautId: string): Symptom[];
  addSymptom(astronautId: string, symptom: NewSymptom): Symptom;
  resolveSymptom(symptomId: string): void;
  getAlerts(astronautId: string): Alert[];
  acknowledgeAlert(alertId: string): void;
  logAction(alertId: string, kind: AlertActionKind, note?: string): void;
  queueReport(astronautId: string, report: NewReport): Report;
  getDownlinkQueue(): Report[];
  setScenario(scenario: ScenarioId, astronautId: string): void;
  setEarthLink(up: boolean): void;
  setMissionSetting(setting: MissionSettingId): void;
  /** Solar storm scenario: the NASA DONKI events placed on the mission clock. Empty in other scenarios. */
  getSolarEvents(): ReplayedEvent[];
  setSleepPeriod(on: boolean): void;
}
