// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Turns raw data from a DataSource into what the screens show for one astronaut.
import {
  INDICATORS,
  INDICATOR_KEYS,
  lookbackHistory,
  PART_BY_ID,
  REGIONS,
  classify,
  symptomStatus,
  routineContext,
  evaluate,
  formatValue,
  startOfDay,
  trendArrow,
  worstStatus,
  type Alert,
  type Astronaut,
  type Evaluation,
  type Level,
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
  /** Exercise only: valueText is the shirt's running total, not yet confirmed by the astronaut. */
  soFar: boolean;
  arrow: TrendArrow;
  /** The open routine task for this indicator, if one is due or overdue. */
  openTask?: RoutineEntry;
  /** A short series for the row sparkline: the last hour for live sources, recent entries for entered ones. */
  spark: SparkPoint[];
  /** Lowest and highest value in that same period, as text without the unit. */
  recentRange: string | null;
}

export interface SparkPoint {
  t: number;
  v: number;
  level: Level;
}

const SPARK_BUCKETS = 40;

function buildSpark(key: IndicatorKey, readings: readonly Reading[], entered: boolean): SparkPoint[] {
  if (entered) {
    const from = Math.max(0, readings.length - 14);
    return readings.slice(from).map((r, i) => ({ t: r.t, v: r.value, level: classify(key, readings, from + i).level }));
  }
  if (readings.length <= SPARK_BUCKETS) return readings.map((r) => ({ t: r.t, v: r.value, level: classify(key, [r]).level }));
  const out: SparkPoint[] = [];
  const size = readings.length / SPARK_BUCKETS;
  for (let b = 0; b < SPARK_BUCKETS; b++) {
    const slice = readings.slice(Math.floor(b * size), Math.floor((b + 1) * size));
    if (!slice.length) continue;
    const v = slice.reduce((a, r) => a + r.value, 0) / slice.length;
    out.push({ t: slice[slice.length - 1].t, v, level: classify(key, [{ ...slice[0], value: v }]).level });
  }
  return out;
}

function buildRange(key: IndicatorKey, readings: readonly Reading[], entered: boolean, now: number): string | null {
  const recent = entered ? readings.filter((r) => r.t >= now - 7 * 86400) : readings;
  if (!recent.length) return null;
  if (key === "bp") {
    const sys = recent.map((r) => r.value);
    const dia = recent.map((r) => r.value2 ?? r.value);
    return `${Math.min(...sys)}/${Math.min(...dia)} to ${Math.max(...sys)}/${Math.max(...dia)}`;
  }
  const vs = recent.map((r) => r.value);
  const lo = formatValue(key, Math.min(...vs));
  const hi = formatValue(key, Math.max(...vs));
  return lo === hi ? lo : `${lo} to ${hi}`;
}

export interface HealthView {
  astronaut: Astronaut;
  now: number;
  indicators: Record<IndicatorKey, IndicatorState>;
  /** null: this prototype does not measure the region directly. */
  regions: Record<RegionId, Status | null>;
  /** The same, from readings alone. The figure tints a region from this; a symptom marks only its own part. */
  regionReadings: Record<RegionId, Status | null>;
  /** Status of each body part that has an active symptom, by part id. */
  parts: Record<string, Status>;
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
    // The task to start from this row: overdue first, then due, then the next one today.
    const openTask = tasks.find((e) => e.state.kind === "overdue") ?? tasks.find((e) => e.state.kind === "due") ?? tasks.find((e) => e.state.kind === "upcoming");
    const history = entered ? undefined : () => lookbackHistory((w) => source.getReadings(astronaut.id, key, w));
    const ev = evaluate(key, readings, { now, routine: routineContext(routine.entries, key), history });
    const latest = ev.latest;
    const current = latest !== undefined && ev.status !== "nodata" && ev.status !== "due" && (!entered || latest.t >= startOfDay(now));
    // Exercise always shows the shirt's count for today; until it is confirmed it is a running total.
    const soFar = key === "exercise" && !(current && latest);
    indicators[key] = {
      key,
      def,
      ev,
      status: ev.status,
      latest,
      valueText: soFar ? String(source.getExerciseSoFar(astronaut.id)) : current && latest ? formatValue(key, latest.value, latest.value2) : null,
      soFar,
      arrow: current ? trendArrow(key, readings, now) : "flat",
      openTask,
      spark: buildSpark(key, readings, entered),
      recentRange: buildRange(key, readings, entered, now),
    };
    if (entered && latest && latest.t >= startOfDay(now) && (lastCheckIn === undefined || latest.t > lastCheckIn)) lastCheckIn = latest.t;
  }
  const regions = {} as Record<RegionId, Status | null>;
  // Due ranks with In range, so a check that is simply due never makes things look worse.
  // A region whose only readings are all due says so, rather than claiming In range.
  const counted = (keys: IndicatorKey[]): Status => {
    const statuses = keys.map((k) => indicators[k].status);
    const worst = worstStatus(statuses);
    return worst === "ok" && statuses.length > 0 && statuses.every((s) => s === "due") ? "due" : worst;
  };
  for (const r of REGIONS) regions[r.id] = r.indicators.length ? counted(r.indicators) : null;

  // Active symptoms give their body part a status. A part with several takes the worst.
  const parts: Record<string, Status> = {};
  for (const sym of source.getSymptoms(astronaut.id)) {
    const st = symptomStatus(sym, now);
    if (!st) continue;
    parts[sym.partId] = parts[sym.partId] ? worstStatus([parts[sym.partId], st]) : st;
  }
  // A region's status is the worst of its readings and the symptoms on its parts.
  // The figure still tints regions from readings alone, so a sore knee marks the knee, not every limb.
  const combined = { ...regions };
  for (const [partId, st] of Object.entries(parts)) {
    const region = PART_BY_ID[partId]?.region;
    if (!region) continue;
    const base = combined[region];
    combined[region] = base === null ? st : worstStatus([base, st]);
  }
  return {
    astronaut,
    now,
    indicators,
    regions: combined,
    regionReadings: regions,
    parts,
    overall: worstStatus([...INDICATOR_KEYS.map((k) => indicators[k].status), ...Object.values(parts)]),
    routine,
    alerts: source.getAlerts(astronaut.id),
    lastCheckIn,
  };
}

/** Indicators sorted worst first, for the summary and the default selection. */
export function byPriority(view: HealthView): IndicatorState[] {
  const rank: Record<Status, number> = { warning: 0, caution: 1, watch: 2, nodata: 3, due: 4, ok: 5 };
  return INDICATOR_KEYS.map((k) => view.indicators[k]).sort((a, b) => rank[a.status] - rank[b.status]);
}
