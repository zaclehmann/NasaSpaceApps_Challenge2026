// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Turns raw data from a DataSource into what the screens show for one astronaut.
import {
  INDICATORS,
  INDICATOR_KEYS,
  REGIONS,
  evaluate,
  formatValue,
  startOfDay,
  trendArrow,
  worstStatus,
  type Alert,
  type Astronaut,
  type Evaluation,
  type IndicatorDef,
  type IndicatorKey,
  type Reading,
  type RegionId,
  type RoutineEntry,
  type RoutineSummary,
  type Status,
  type TrendArrow,
} from "@missionvitals/shared";
import type { DataSource } from "./DataSource";

export interface IndicatorState {
  key: IndicatorKey;
  def: IndicatorDef;
  ev: Evaluation;
  status: Status;
  latest?: Reading;
  /** Value text without the unit, or null when there is no current value to show. */
  valueText: string | null;
  arrow: TrendArrow;
  /** The open routine task for this indicator, if one is due or overdue. */
  openTask?: RoutineEntry;
}

export interface HealthView {
  astronaut: Astronaut;
  now: number;
  indicators: Record<IndicatorKey, IndicatorState>;
  /** null: this prototype does not measure the region directly. */
  regions: Record<RegionId, Status | null>;
  overall: Status;
  routine: RoutineSummary;
  alerts: Alert[];
  lastCheckIn?: number;
}

export function buildHealth(source: DataSource, astronaut: Astronaut): HealthView {
  const now = source.getMission().met;
  const routine = source.getRoutine(astronaut.id);
  const indicators = {} as Record<IndicatorKey, IndicatorState>;
  let lastCheckIn: number | undefined;
  for (const key of INDICATOR_KEYS) {
    const def = INDICATORS[key];
    const entered = def.source === "entered";
    const readings = source.getReadings(astronaut.id, key, entered ? "30d" : "1h");
    const tasks = routine.entries.filter((e) => e.task.kind === key);
    const openTask = tasks.find((e) => e.state.kind === "overdue") ?? tasks.find((e) => e.state.kind === "due");
    const ev = evaluate(key, readings, { now, routine: openTask ? (openTask.state.kind === "overdue" ? "overdue" : "due") : "none" });
    const latest = ev.latest;
    const current = latest !== undefined && ev.status !== "nodata" && (!entered || latest.t >= startOfDay(now));
    indicators[key] = {
      key,
      def,
      ev,
      status: ev.status,
      latest,
      valueText: current && latest ? formatValue(key, latest.value, latest.value2) : null,
      arrow: current ? trendArrow(key, readings, now) : "flat",
      openTask,
    };
    if (entered && latest && latest.t >= startOfDay(now) && (lastCheckIn === undefined || latest.t > lastCheckIn)) lastCheckIn = latest.t;
  }
  const regions = {} as Record<RegionId, Status | null>;
  // A check that is simply due today does not make a region or the overall status "No data".
  const counted = (keys: IndicatorKey[]) => {
    const live = keys.filter((k) => indicators[k].ev.reason !== "not-taken");
    return live.length ? worstStatus(live.map((k) => indicators[k].status)) : keys.length ? ("nodata" as Status) : ("ok" as Status);
  };
  for (const r of REGIONS) regions[r.id] = r.indicators.length ? counted(r.indicators) : null;
  return {
    astronaut,
    now,
    indicators,
    regions,
    overall: counted(INDICATOR_KEYS),
    routine,
    alerts: source.getAlerts(astronaut.id),
    lastCheckIn,
  };
}

/** Indicators sorted worst first, for the summary and the default selection. */
export function byPriority(view: HealthView): IndicatorState[] {
  const rank: Record<Status, number> = { warning: 0, caution: 1, watch: 2, nodata: 3, ok: 4 };
  return INDICATOR_KEYS.map((k) => view.indicators[k]).sort((a, b) => rank[a.status] - rank[b.status]);
}
