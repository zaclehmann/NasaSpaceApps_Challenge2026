// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// One indicator per chart (ui.md 7). Recharts with its defaults overridden:
// line for live data, dots for entered readings, range bars for blood pressure, bars for sleep,
// a demo-range band, dashed demo limits, gaps for missing data, an alert marker and a table view.
import { useMemo, useState } from "react";
import { CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  DAY,
  DEVICE_NAMES,
  INDICATORS,
  STATUS_WORD,
  WINDOW_SEC,
  classify,
  formatClock,
  formatValue,
  missionDay,
  sampleStepSec,
  type Alert,
  type ChartWindow,
  type IndicatorKey,
  type Reading,
  type Status,
} from "@missionvitals/shared";
import { useData } from "../../data/DataProvider";
import { STATUS_VAR } from "../status/statusStyles";
import { Button } from "../ui/Button";

interface Point {
  t: number;
  v: number | null;
  v2?: number;
  caution: number | null;
  warning: number | null;
  status: Status;
  reading?: Reading;
}

const WINDOW_WORDS: Record<ChartWindow, string> = { "1h": "the last hour", "24h": "the last 24 hours", "7d": "the last 7 days", "14d": "the last 14 days", "30d": "the last 30 days" };
const TEXT = { fill: "var(--subtle-foreground)", fontSize: 12 };

function timeLabel(t: number, window: ChartWindow): string {
  return window === "1h" || window === "24h" ? formatClock(t) : `Day ${missionDay(t)}`;
}

function fullTime(t: number): string {
  return `Day ${missionDay(t)}, ${formatClock(t)} MET`;
}

function xTicks(start: number, end: number, window: ChartWindow): number[] {
  const step = window === "1h" ? 900 : window === "24h" ? 6 * 3600 : window === "7d" ? 2 * DAY : window === "14d" ? 3 * DAY : 7 * DAY;
  const out: number[] = [];
  // Day-based ticks sit at midday so a tick lines up with the readings of that day.
  const offset = step >= DAY ? DAY / 2 : 0;
  for (let t = Math.ceil((start - offset) / step) * step + offset; t <= end; t += step) out.push(t);
  return out;
}

const STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200];

/** A tight y scale with round tick values. It always includes the demo limits, so the band is in view. */
function scale(key: IndicatorKey, values: number[]): { domain: [number, number]; ticks: number[] } {
  const def = INDICATORS[key];
  if (key === "mood") return { domain: [1, 5], ticks: [1, 2, 3, 4, 5] };
  const all = [...values];
  if (def.low !== undefined) all.push(def.low);
  if (def.high !== undefined) all.push(def.high);
  if (key === "bp") all.push(85, 60);
  if (key === "sleep") all.push(0, 9);
  if (key === "exercise") all.push(0);
  if (!all.length) return { domain: [0, 1], ticks: [0, 1] };
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  const pad = Math.max((hi - lo) * 0.06, def.decimals ? 0.1 : 1);
  lo = key === "sleep" || key === "exercise" || key === "radiation" ? Math.max(0, lo - pad) : lo - pad;
  hi = key === "spo2" ? Math.min(100, hi + pad) : hi + pad;
  const step = STEPS.find((x) => (hi - lo) / x <= 5) ?? 200;
  const d0 = Math.floor(lo / step) * step;
  const d1 = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let t = d0; t <= d1 + step / 100; t += step) ticks.push(Number(t.toFixed(2)));
  return { domain: [d0, d1], ticks };
}

/** At most this many points are drawn for a line, so it stays a clean stroke at any width. */
const MAX_LINE_POINTS = 150;

/** Average neighbouring points into buckets. A bucket keeps its worst status, and gaps stay gaps. */
function thin(points: Point[]): Point[] {
  const real = points.filter((p) => p.v !== null).length;
  const size = Math.ceil(real / MAX_LINE_POINTS);
  if (size <= 1) return points;
  const out: Point[] = [];
  let bucket: Point[] = [];
  const flush = () => {
    if (!bucket.length) return;
    const v = bucket.reduce((a, p) => a + (p.v ?? 0), 0) / bucket.length;
    const worst = bucket.some((p) => p.status === "warning") ? "warning" : bucket.some((p) => p.status === "caution") ? "caution" : "ok";
    const last = bucket[bucket.length - 1];
    out.push({ t: last.t, v, caution: worst === "caution" ? v : null, warning: worst === "warning" ? v : null, status: worst, reading: last.reading });
    bucket = [];
  };
  for (const p of points) {
    if (p.v === null) {
      flush();
      out.push(p);
    } else {
      bucket.push(p);
      if (bucket.length >= size) flush();
    }
  }
  flush();
  return out;
}

function ChartTip({ active, payload, indicator }: { active?: boolean; payload?: { payload: Point }[]; indicator: IndicatorKey }) {
  const p = payload?.[0]?.payload;
  if (!active || !p || p.v === null) return null;
  const def = INDICATORS[indicator];
  return (
    <div className="rounded-md bg-card px-3 py-2 type-caption text-foreground shadow-float">
      <div className="text-subtle-foreground">{fullTime(p.t)}</div>
      <div className="type-small font-semibold">
        {formatValue(indicator, p.v, p.v2)}
        {indicator === "mood" ? "" : ` ${def.unit}`}
      </div>
      <div className="text-muted-foreground">
        {STATUS_WORD[p.status]}, {DEVICE_NAMES[p.reading?.device ?? def.device].toLowerCase()}
      </div>
    </div>
  );
}

interface Props {
  astronautId: string;
  indicator: IndicatorKey;
  window: ChartWindow;
  alert?: Alert;
  /** Small trend thumbnail: no axes, labels or table. */
  compact?: boolean;
  height?: number;
}

export function IndicatorChart({ astronautId, indicator, window: win, alert, compact = false, height = 180 }: Props) {
  const { source, version } = useData();
  const [table, setTable] = useState(false);
  const def = INDICATORS[indicator];
  const entered = def.source === "entered";

  const model = useMemo(() => {
    const readings = source.getReadings(astronautId, indicator, win);
    const now = source.getMission().met;
    const start = now - WINDOW_SEC[win];
    const step = sampleStepSec(indicator, win);
    const points: Point[] = [];
    const gaps: [number, number][] = [];
    readings.forEach((r, i) => {
      const c = classify(indicator, readings, i);
      const status: Status = c.level;
      if (!entered && i > 0 && r.t - readings[i - 1].t > 3 * step) {
        gaps.push([readings[i - 1].t, r.t]);
        points.push({ t: (readings[i - 1].t + r.t) / 2, v: null, caution: null, warning: null, status: "nodata" });
      }
      points.push({ t: r.t, v: r.value, v2: r.value2, caution: c.level === "caution" ? r.value : null, warning: c.level === "warning" ? r.value : null, status, reading: r });
    });
    if (!entered) {
      const last = readings[readings.length - 1];
      if (!last) gaps.push([start, now]);
      else if (now - last.t > 3 * def.expectedIntervalSec) gaps.push([last.t, now]);
      const first = readings[0];
      if (first && first.t - start > 3 * step) gaps.unshift([start, first.t]);
    }
    const values = readings.flatMap((r) => (indicator === "bp" ? [r.value, r.value2 ?? r.value] : [r.value]));
    const latest = readings[readings.length - 1];
    let extreme: Reading | undefined;
    if (!entered && readings.length > 2) {
      const mid = def.low !== undefined && def.high !== undefined ? (def.low + def.high) / 2 : def.low !== undefined ? 100 : 0;
      extreme = readings.reduce((a, b) => (Math.abs(b.value - mid) > Math.abs(a.value - mid) ? b : a));
      // Label the extreme only when it is out of range and is not the latest value, so calm charts stay calm.
      if (classify(indicator, [extreme]).level === "ok" || (latest && Math.abs(extreme.value - latest.value) < (def.decimals ? 0.3 : 4))) extreme = undefined;
    }
    return { readings, points: def.chart === "line" ? thin(points) : points, gaps, start, now, ...scale(indicator, values), latest, extreme, values };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, version, astronautId, indicator, win]);

  const { points, gaps, start, now, domain, ticks, latest, extreme, readings, values } = model;
  const summary = values.length
    ? `${def.name} over ${WINDOW_WORDS[win]}. Latest ${latest ? formatValue(indicator, latest.value, latest.value2) : ""}${indicator === "mood" ? "" : ` ${def.unit}`}, lowest ${formatValue(
        indicator === "bp" ? "hr" : indicator,
        Math.min(...values),
      )}, highest ${formatValue(indicator === "bp" ? "hr" : indicator, Math.max(...values))}. Demo range ${def.rangeText}.`
    : `${def.name} over ${WINDOW_WORDS[win]}. No readings.`;

  const dotColor = (s: Status) => (s === "ok" ? "var(--foreground)" : STATUS_VAR[s]);
  const bandLow = def.low ?? domain[0];
  const bandHigh = def.high ?? domain[1];
  const showAlert = alert && alert.firedAt > start && !compact;
  const fmtY = (v: number) => (indicator === "temp" || (ticks.length > 1 && ticks[1] - ticks[0] < 1) ? v.toFixed(1) : String(v));

  const tableRows = useMemo(() => {
    const max = 48;
    if (readings.length <= max) return [...readings].reverse();
    const every = Math.ceil(readings.length / max);
    return readings.filter((_, i) => (readings.length - 1 - i) % every === 0).reverse();
  }, [readings]);

  const chart = (
    <ResponsiveContainer width="100%" height={compact ? 44 : height}>
      <ComposedChart data={points} margin={compact ? { top: 4, right: 4, bottom: 4, left: 4 } : { top: 18, right: 66, bottom: 0, left: 0 }} accessibilityLayer={false}>
        <defs>
          <pattern id="mv-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--border-strong)" strokeWidth="1.5" />
          </pattern>
        </defs>
        {!compact && <CartesianGrid vertical={false} stroke="var(--border)" />}
        <XAxis
          dataKey="t"
          type="number"
          domain={[start, now]}
          ticks={xTicks(start, now, win)}
          tickFormatter={(t: number) => timeLabel(t, win)}
          tick={TEXT}
          tickLine={false}
          axisLine={{ stroke: "var(--border-strong)" }}
          hide={compact}
          allowDataOverflow
        />
        <YAxis
          type="number"
          domain={domain}
          ticks={ticks}
          interval={0}
          tickFormatter={fmtY}
          tick={TEXT}
          tickLine={false}
          axisLine={false}
          width={34}
          hide={compact}
          allowDataOverflow
        />
        <ReferenceArea
          y1={bandLow}
          y2={bandHigh}
          fill="var(--muted)"
          fillOpacity={1}
          stroke="none"
          ifOverflow="hidden"
        />
        {!compact && def.high !== undefined && (
          <ReferenceLine y={def.high} stroke="var(--border-strong)" strokeDasharray="4 3" label={{ value: `${fmtY(def.high)} limit`, position: "right", ...TEXT }} />
        )}
        {!compact && def.low !== undefined && indicator !== "mood" && indicator !== "bp" && (
          <ReferenceLine y={def.low} stroke="var(--border-strong)" strokeDasharray="4 3" label={{ value: `${fmtY(def.low)} limit`, position: "right", ...TEXT }} />
        )}
        {gaps.map(([a, b]) => (
          <ReferenceArea key={a} x1={Math.max(a, start)} x2={b} fill="url(#mv-hatch)" fillOpacity={1} stroke="none" label={compact ? undefined : { value: "No data", position: "insideTop", ...TEXT }} />
        ))}
        {showAlert && alert && (
          <ReferenceLine
            x={alert.firedAt}
            stroke={STATUS_VAR[alert.status]}
            strokeWidth={1}
            label={{ value: `${STATUS_WORD[alert.status]} ${formatClock(alert.firedAt)}`, position: "top", ...TEXT }}
          />
        )}
        {!compact && (
          <Tooltip
            content={<ChartTip indicator={indicator} />}
            cursor={def.chart === "line" ? { stroke: "var(--border-strong)", strokeWidth: 1 } : false}
            isAnimationActive={false}
            filterNull
          />
        )}
        {def.chart === "line" && (
          <>
            <Line dataKey="v" stroke="var(--foreground)" strokeWidth={2} type="linear" dot={false} activeDot={compact ? false : { r: 4, fill: "var(--foreground)", stroke: "var(--card)", strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
            <Line dataKey="caution" stroke="var(--caution)" strokeWidth={2} type="linear" dot={false} activeDot={false} connectNulls={false} isAnimationActive={false} tooltipType="none" />
            <Line dataKey="warning" stroke="var(--warning)" strokeWidth={2} type="linear" dot={false} activeDot={false} connectNulls={false} isAnimationActive={false} tooltipType="none" />
            {latest && now - latest.t <= 3 * def.expectedIntervalSec && (
              <ReferenceDot
                x={latest.t}
                y={latest.value}
                r={compact ? 2.5 : 4}
                fill="var(--foreground)"
                stroke="var(--card)"
                strokeWidth={2}
              />
            )}
            {extreme && !compact && <ReferenceDot x={extreme.t} y={extreme.value} r={0} label={{ value: formatValue(indicator, extreme.value), position: extreme.value >= (latest?.value ?? 0) ? "top" : "bottom", ...TEXT }} />}
          </>
        )}
        {def.chart === "dots" && (
          <Line
            dataKey="v"
            stroke="none"
            isAnimationActive={false}
            dot={(p: { cx?: number; cy?: number; payload?: Point; index?: number }) => <circle key={p.index} cx={p.cx} cy={p.cy} r={compact ? 2.5 : 4} fill={dotColor(p.payload?.status ?? "ok")} />}
            activeDot={{ r: 6, fill: "var(--foreground)", stroke: "var(--card)", strokeWidth: 2 }}
          />
        )}
        {(def.chart === "bp" || def.chart === "bars") && (
          <>
            {points.map((p) =>
              p.v === null ? null : (
                <ReferenceLine
                  key={p.t}
                  segment={[
                    { x: p.t, y: def.chart === "bp" ? (p.v2 ?? p.v) : 0 },
                    { x: p.t, y: p.v },
                  ]}
                  stroke={dotColor(p.status)}
                  strokeWidth={compact ? 2 : win === "30d" ? 3 : 6}
                  strokeLinecap={def.chart === "bp" ? "round" : "butt"}
                  ifOverflow="hidden"
                />
              ),
            )}
            <Line dataKey="v" stroke="none" dot={false} isAnimationActive={false} activeDot={{ r: 5, fill: "var(--foreground)", stroke: "var(--card)", strokeWidth: 2 }} />
          </>
        )}
        {!compact && indicator === "bp" && <ReferenceLine y={85} stroke="var(--border-strong)" strokeDasharray="4 3" label={{ value: "85 limit", position: "right", ...TEXT }} />}
        {!compact && indicator === "bp" && <ReferenceLine y={60} stroke="var(--border-strong)" strokeDasharray="4 3" label={{ value: "60 limit", position: "right", ...TEXT }} />}
      </ComposedChart>
    </ResponsiveContainer>
  );

  if (compact) {
    return (
      <div role="img" aria-label={summary} className="w-full">
        {chart}
      </div>
    );
  }

  return (
    <figure className="min-w-0">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="type-caption text-subtle-foreground">
          {indicator === "mood" ? "1 Very low to 5 Very good" : indicator === "bp" ? "mmHg, diastolic to systolic" : def.unit}. Shaded: demo range{indicator === "bp" ? ", systolic" : indicator === "glucose" ? ", fasting" : indicator === "exercise" ? " (target)" : ""}.
        </span>
        <Button variant="text" size="sm" aria-pressed={table} onClick={() => setTable((x) => !x)}>
          {table ? "View as chart" : "View as table"}
        </Button>
      </figcaption>
      {table ? (
        <div className="max-h-[260px] overflow-auto">
          <table className="w-full type-small">
            <caption className="sr-only">{summary}</caption>
            <thead className="sticky top-0 bg-muted type-label text-muted-foreground">
              <tr>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  Time
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {def.name}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tableRows.map((r) => (
                <tr key={r.t}>
                  <td className="px-2 py-2 text-muted-foreground">{fullTime(r.t)}</td>
                  <td className="px-2 py-2 text-right font-medium">
                    {formatValue(indicator, r.value, r.value2)}
                    {indicator === "mood" ? "" : ` ${def.unit}`}
                  </td>
                  <td className="px-2 py-2">{STATUS_WORD[classify(indicator, readings, readings.indexOf(r)).level]}</td>
                </tr>
              ))}
              {!tableRows.length && (
                <tr>
                  <td colSpan={3} className="px-2 py-3 text-muted-foreground">
                    No readings in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div role="img" aria-label={summary}>
          {chart}
        </div>
      )}
    </figure>
  );
}
