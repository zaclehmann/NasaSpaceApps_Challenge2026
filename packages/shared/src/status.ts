// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The status function. Pure: same inputs, same answer. All limits are DEMO values (see indicators.ts).
import { INDICATORS, formatValue } from "./indicators";
import { DAY, formatDuration, startOfDay } from "./time";
import type { GlucoseTiming, IndicatorKey, Reading, Status } from "./types";

export type Side = "above" | "below";
export type Level = "ok" | "caution" | "warning";

/**
 * Today's routine for this indicator. "missed" means the day ended without the measurement;
 * a data source sets it when it reports on a past day.
 */
export type RoutineContext = "none" | "upcoming" | "due" | "overdue" | "missed";

export interface StatusContext {
  /** Current MET in seconds. Defaults to the time of the latest reading. */
  now?: number;
  routine?: RoutineContext;
  /**
   * A longer, coarser series of readings (oldest first), fetched only when an out-of-range run reaches the start
   * of `readings`. Used to find when the run began, up to OUT_OF_RANGE_LOOKBACK_SEC back.
   */
  history?: () => readonly Reading[];
}

/** How far back "out of range since" looks for the last in-range reading. */
export const OUT_OF_RANGE_LOOKBACK_SEC = 48 * 3600;

/**
 * The series to pass as `history`: the last 24 hours at full chart detail, and the 7-day series before that,
 * so "out of range since" can reach back 48 hours. `get` returns a chart window's readings, oldest first.
 */
export function lookbackHistory(get: (window: "24h" | "7d") => readonly Reading[]): readonly Reading[] {
  const day = get("24h");
  const start = day.length ? day[0].t : Infinity;
  return [...get("7d").filter((r) => r.t < start), ...day];
}

export interface Evaluation {
  status: Status;
  reason: "in-range" | "trend" | "due" | "overdue" | "out-of-range" | "silent" | "not-taken";
  side?: Side;
  /** The demo limit that was crossed or is being approached. */
  limit?: number;
  /** True when the rule includes the limit itself ("at or above"). */
  inclusive?: boolean;
  /** For blood pressure: which number drove the status. */
  component?: "systolic" | "diastolic";
  /** Mood and exercise: low on two days running. */
  twoDays?: boolean;
  /** MET when the current out-of-range run began. */
  since?: number;
  latest?: Reading;
}

interface Classified {
  level: Level;
  side?: Side;
  limit?: number;
  inclusive?: boolean;
  component?: "systolic" | "diastolic";
  twoDays?: boolean;
}

const round = (v: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};

const OK: Classified = { level: "ok" };

/** Top of the in-range band for blood glucose. It depends on when the reading was taken. */
export function glucoseHigh(timing?: GlucoseTiming): number {
  return timing === "after-meal" ? 140 : 110;
}

/** The demo range in words for one reading. Glucose after a meal has its own range. */
export function rangeTextFor(key: IndicatorKey, r?: Reading): string {
  if (key === "glucose" && r?.timing === "after-meal") return "70 to 140 mg/dL after a meal";
  return INDICATORS[key].rangeText;
}

/** True if the reading on the mission day before reading i passes the test. */
function dayBefore(readings: readonly Reading[], i: number, test: (v: number) => boolean): boolean {
  const dayStart = startOfDay(readings[i].t);
  for (let j = i - 1; j >= 0; j--) {
    const p = readings[j];
    if (p.t >= dayStart) continue;
    return p.t >= dayStart - DAY && test(p.value);
  }
  return false;
}

/**
 * Classify the reading at index i against the demo thresholds.
 * Values are rounded to the precision shown on screen first, so the number and its status never disagree.
 */
export function classify(key: IndicatorKey, readings: readonly Reading[], i: number = readings.length - 1): Classified {
  const r = readings[i];
  if (!r) return OK;
  const v = round(r.value, INDICATORS[key].decimals);
  switch (key) {
    case "hr":
      if (v < 40) return { level: "warning", side: "below", limit: 40 };
      if (v > 140) return { level: "warning", side: "above", limit: 140 };
      if (v < 50) return { level: "caution", side: "below", limit: 50 };
      if (v > 110) return { level: "caution", side: "above", limit: 110 };
      return OK;
    case "spo2":
      if (v < 90) return { level: "warning", side: "below", limit: 90 };
      if (v < 94) return { level: "caution", side: "below", limit: 94 };
      return OK;
    case "temp":
      if (v < 35.5) return { level: "warning", side: "below", limit: 35.5 };
      if (v >= 38.5) return { level: "warning", side: "above", limit: 38.5, inclusive: true };
      if (v < 36.0) return { level: "caution", side: "below", limit: 36.0 };
      if (v > 37.5) return { level: "caution", side: "above", limit: 37.5 };
      return OK;
    case "bp": {
      const d = Math.round(r.value2 ?? 0);
      if (v >= 160) return { level: "warning", side: "above", limit: 160, inclusive: true, component: "systolic" };
      if (v < 80) return { level: "warning", side: "below", limit: 80, component: "systolic" };
      if (d >= 100) return { level: "warning", side: "above", limit: 100, inclusive: true, component: "diastolic" };
      if (v > 135) return { level: "caution", side: "above", limit: 135, component: "systolic" };
      if (v < 90) return { level: "caution", side: "below", limit: 90, component: "systolic" };
      if (d > 85) return { level: "caution", side: "above", limit: 85, component: "diastolic" };
      if (d < 60) return { level: "caution", side: "below", limit: 60, component: "diastolic" };
      return OK;
    }
    case "glucose": {
      const high = glucoseHigh(r.timing);
      if (v < 55) return { level: "warning", side: "below", limit: 55 };
      if (v > 180) return { level: "warning", side: "above", limit: 180 };
      if (v < 70) return { level: "caution", side: "below", limit: 70 };
      if (v > high) return { level: "caution", side: "above", limit: high };
      return OK;
    }
    case "sleep":
      if (v < 5) return { level: "warning", side: "below", limit: 5 };
      if (v < 6) return { level: "caution", side: "below", limit: 6 };
      return OK;
    case "exercise":
      if (v >= 120) return OK;
      if (v < 60 && dayBefore(readings, i, (x) => Math.round(x) < 60)) return { level: "warning", side: "below", limit: 60, twoDays: true };
      return { level: "caution", side: "below", limit: 120 };
    case "mood":
      if (v >= 3) return OK;
      if (v <= 1 && dayBefore(readings, i, (x) => Math.round(x) <= 1)) return { level: "warning", side: "below", limit: 3, twoDays: true };
      return { level: "caution", side: "below", limit: 3 };
    case "radiation":
      if (v > 50) return { level: "warning", side: "above", limit: 50 };
      if (v >= 20) return { level: "caution", side: "above", limit: 20, inclusive: true };
      return OK;
  }
}

/**
 * Watch rule settings.
 * margin: how far inside a demo limit counts as "near" it. Fixed per indicator; for blood pressure,
 * systolic and diastolic have their own margins.
 * minChange: the smallest move toward the limit that counts as a trend, so noise does not.
 * arrowMin: the smallest change that turns the list's trend arrow up or down.
 */
export const WATCH: Record<IndicatorKey, { margin: number; minChange: number; arrowMin: number }> = {
  hr: { margin: 6, minChange: 5, arrowMin: 3 },
  spo2: { margin: 1, minChange: 1, arrowMin: 1 },
  temp: { margin: 0.3, minChange: 0.2, arrowMin: 0.2 },
  bp: { margin: 10, minChange: 4, arrowMin: 4 },
  glucose: { margin: 10, minChange: 5, arrowMin: 5 },
  sleep: { margin: 0.5, minChange: 0.3, arrowMin: 0.3 },
  exercise: { margin: 15, minChange: 10, arrowMin: 10 },
  mood: { margin: 0, minChange: 0.3, arrowMin: 1 },
  radiation: { margin: 2, minChange: 1.5, arrowMin: 0.5 },
};

/** Diastolic blood pressure has a tighter margin than systolic. */
export const BP_DIASTOLIC_MARGIN = 5;

/** Entered readings trend over this many days. */
export const TREND_DAYS = 3;

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

type Pick = (r: Reading) => number;
const primary: Pick = (r) => r.value;
const secondary: Pick = (r) => r.value2 ?? NaN;

/**
 * How far the value has moved over the trend window.
 * Live sources: mean of the last 10 minutes minus the mean from 50 to 70 minutes ago (the last hour).
 * Entered readings: the latest reading minus the mean of the readings in the 3 days before it.
 */
export function trendChange(key: IndicatorKey, readings: readonly Reading[], now: number, pick: Pick = primary): number | undefined {
  if (!readings.length) return undefined;
  if (INDICATORS[key].source === "entered") {
    const last = readings[readings.length - 1];
    const prev = readings
      .slice(0, -1)
      .filter((r) => r.t >= last.t - TREND_DAYS * DAY)
      .map(pick)
      .filter((x) => !Number.isNaN(x));
    if (!prev.length) return undefined;
    return pick(last) - mean(prev);
  }
  const recent: number[] = [];
  const earlier: number[] = [];
  for (let i = readings.length - 1; i >= 0; i--) {
    const age = now - readings[i].t;
    if (age > 70 * 60) break;
    if (age <= 10 * 60) recent.push(pick(readings[i]));
    else if (age >= 50 * 60) earlier.push(pick(readings[i]));
  }
  if (!recent.length || !earlier.length) return undefined;
  return mean(recent) - mean(earlier);
}

interface Approach {
  side: Side;
  limit: number;
  component?: "systolic" | "diastolic";
}

function approaching(key: IndicatorKey, readings: readonly Reading[], now: number): Approach | undefined {
  const def = INDICATORS[key];
  const w = WATCH[key];
  const latest = readings[readings.length - 1];
  const candidates: (Approach & { pick: Pick; margin: number })[] = [];
  if (key === "bp") {
    candidates.push({ limit: 135, side: "above", pick: primary, margin: w.margin, component: "systolic" });
    candidates.push({ limit: 90, side: "below", pick: primary, margin: w.margin, component: "systolic" });
    candidates.push({ limit: 85, side: "above", pick: secondary, margin: BP_DIASTOLIC_MARGIN, component: "diastolic" });
    candidates.push({ limit: 60, side: "below", pick: secondary, margin: BP_DIASTOLIC_MARGIN, component: "diastolic" });
  } else {
    const high = key === "glucose" ? glucoseHigh(latest.timing) : def.high;
    if (high !== undefined) candidates.push({ limit: high, side: "above", pick: primary, margin: w.margin });
    if (def.low !== undefined) candidates.push({ limit: def.low, side: "below", pick: primary, margin: w.margin });
  }
  for (const c of candidates) {
    const v = round(c.pick(latest), def.decimals);
    const near = c.side === "above" ? v >= c.limit - c.margin - 1e-9 : v <= c.limit + c.margin + 1e-9;
    if (!near) continue;
    const change = trendChange(key, readings, now, c.pick);
    if (change === undefined) continue;
    const toward = c.side === "above" ? change : -change;
    if (toward >= w.minChange) return { side: c.side, limit: c.limit, component: c.component };
  }
  return undefined;
}

/**
 * MET when the current unbroken out-of-range run on this side began: the reading after the last one in range.
 * Walks back through `readings`, then, if the run reaches their start, through `history`, never further than
 * OUT_OF_RANGE_LOOKBACK_SEC before `now`. For live sources a gap in the data (silent sensor) also ends the run;
 * the allowed gap grows with the spacing of the coarser history.
 */
function runStart(key: IndicatorKey, readings: readonly Reading[], side: Side | undefined, now: number, history?: () => readonly Reading[]): number {
  const def = INDICATORS[key];
  const live = def.source !== "entered";
  const cap = now - OUT_OF_RANGE_LOOKBACK_SEC;
  const last = readings.length - 1;
  let since = readings[last].t;
  for (let i = last - 1; i >= 0; i--) {
    if (readings[i].t < cap) return since;
    if (live && readings[i + 1].t - readings[i].t > 3 * def.expectedIntervalSec) return since;
    const c = classify(key, readings, i);
    if (c.level === "ok" || c.side !== side) return since;
    since = readings[i].t;
  }
  // Still out of range at the start of the window: keep looking in the longer history.
  if (!history) return since;
  const h = history().filter((r) => r.t < readings[0].t && r.t >= cap);
  const step = h.length > 1 ? (h[h.length - 1].t - h[0].t) / (h.length - 1) : 0;
  const allowedGap = 3 * Math.max(def.expectedIntervalSec, step);
  let prev = readings[0].t;
  for (let j = h.length - 1; j >= 0; j--) {
    if (live && prev - h[j].t > allowedGap) break;
    const c = classify(key, h, j);
    if (c.level === "ok" || c.side !== side) break;
    since = h[j].t;
    prev = h[j].t;
  }
  return since;
}

/**
 * Full evaluation of an indicator. `readings` must be in time order, oldest first.
 *
 * - Live sources: No data when silent for 3x the expected interval.
 * - Entered measurements not taken today: Due until 1 hour past the routine time, then Watch
 *   (overdue), then No data if the day ends without it.
 * - Warning and Caution: from the demo thresholds table.
 * - Watch: in range, but within a fixed margin of a limit and moving toward it
 *   (last hour for live readings, last 3 days for entered ones), or a routine measurement overdue.
 */
export function evaluate(key: IndicatorKey, readings: readonly Reading[], ctx: StatusContext = {}): Evaluation {
  const def = INDICATORS[key];
  const latest = readings.length ? readings[readings.length - 1] : undefined;
  const now = ctx.now ?? latest?.t ?? 0;
  const routine = ctx.routine ?? "none";

  if (def.source === "entered") {
    const takenToday = latest !== undefined && latest.t >= startOfDay(now);
    if (!takenToday) {
      if (routine === "overdue") return { status: "watch", reason: "overdue", latest };
      if (routine === "due" || routine === "upcoming") return { status: "due", reason: "due", latest };
      return { status: "nodata", reason: "not-taken", latest };
    }
  } else if (!latest || now - latest.t > 3 * def.expectedIntervalSec) {
    return { status: "nodata", reason: "silent", latest };
  }

  const c = classify(key, readings);
  if (c.level !== "ok") {
    return {
      status: c.level,
      reason: "out-of-range",
      side: c.side,
      limit: c.limit,
      inclusive: c.inclusive,
      component: c.component,
      twoDays: c.twoDays,
      since: runStart(key, readings, c.side, now, ctx.history),
      latest,
    };
  }
  const near = approaching(key, readings, now);
  if (near) return { status: "watch", reason: "trend", ...near, latest };
  if (routine === "overdue") return { status: "watch", reason: "overdue", latest };
  return { status: "ok", reason: "in-range", latest };
}

/** The status of an indicator from its readings. Pure. */
export function getStatus(key: IndicatorKey, readings: readonly Reading[], ctx: StatusContext = {}): Status {
  return evaluate(key, readings, ctx).status;
}

export type TrendArrow = "up" | "down" | "flat";

/** Direction for the list: the last minute against 5 to 10 minutes ago, or the previous entry. */
export function trendArrow(key: IndicatorKey, readings: readonly Reading[], now: number): TrendArrow {
  if (readings.length < 2) return "flat";
  const min = WATCH[key].arrowMin;
  let change: number;
  if (INDICATORS[key].source === "entered") {
    change = readings[readings.length - 1].value - readings[readings.length - 2].value;
  } else {
    const recent: number[] = [];
    const earlier: number[] = [];
    for (let i = readings.length - 1; i >= 0; i--) {
      const age = now - readings[i].t;
      if (age > 10 * 60) break;
      if (age <= 60) recent.push(readings[i].value);
      else if (age >= 5 * 60) earlier.push(readings[i].value);
    }
    if (!recent.length || !earlier.length) return "flat";
    change = mean(recent) - mean(earlier);
  }
  if (change >= min) return "up";
  if (change <= -min) return "down";
  return "flat";
}

const fmtLimit = (key: IndicatorKey, limit: number) => `${key === "temp" ? limit.toFixed(1) : String(limit)} ${INDICATORS[key].unit}`;

/** One plain sentence explaining the status, fact first (ui.md 5.3 item 3). Every threshold says "demo". */
export function statusLine(key: IndicatorKey, ev: Evaluation, now: number): string {
  const def = INDICATORS[key];
  const r = ev.latest;
  switch (ev.reason) {
    case "silent":
      return r ? `No reading for ${formatDuration(now - r.t)}.` : "No reading yet.";
    case "due":
      return "Not taken yet today.";
    case "not-taken":
      return "No reading today.";
    case "overdue":
      return r && r.t >= startOfDay(now) ? "In range at the last reading. A routine check is overdue." : "Today's check is more than an hour overdue.";
    case "in-range":
      if (key === "exercise") return "At or above the target of 120 minutes today.";
      return `Inside your range of ${rangeTextFor(key, r)}.`;
    case "trend": {
      if (key === "mood") return "In range, but lower than your recent check-ins.";
      const verb = ev.side === "above" ? "rising" : "falling";
      const span = def.source === "entered" ? `over the last ${TREND_DAYS} days` : "over the last hour";
      const what = ev.component ? `${ev.component === "systolic" ? "Systolic" : "Diastolic"} is ${verb}` : `In range, but ${verb}`;
      return `${what} toward the limit of ${fmtLimit(key, ev.limit ?? 0)} ${span}.`;
    }
    case "out-of-range": {
      const dur = def.source !== "entered" && ev.since !== undefined && r ? ` for ${formatDuration(Math.max(r.t - ev.since, def.expectedIntervalSec))}` : "";
      const side = ev.side === "above" ? (ev.inclusive ? "At or above" : "Above") : "Below";
      if (key === "mood") {
        return ev.twoDays ? "Very low on two days running. Below your range of Okay or better." : `${formatValue("mood", r?.value ?? 1)} today. Below your range of Okay or better.`;
      }
      if (key === "exercise") {
        return ev.twoDays ? "Below 60 minutes on two days running. The target is 120 minutes a day." : `${Math.round(r?.value ?? 0)} minutes today. Below the target of 120 minutes.`;
      }
      if (key === "bp" && r) {
        const which = ev.component === "diastolic" ? `Diastolic ${Math.round(r.value2 ?? 0)}` : `Systolic ${Math.round(r.value)}`;
        const rel = ev.side === "above" ? (ev.inclusive ? "at or above" : "above") : "below";
        const what = ev.status === "warning" ? "the critical limit" : "the limit";
        return `${which} mmHg is ${rel} ${what} of ${ev.limit} mmHg.`;
      }
      if (ev.status === "warning") return `${side} the critical limit of ${fmtLimit(key, ev.limit ?? 0)}${dur}.`;
      // One-sided ranges read better as a limit than as a range.
      if (def.low === undefined || def.high === undefined) return `${side} the limit of ${fmtLimit(key, ev.limit ?? 0)}${dur}.`;
      return `${side} your range of ${rangeTextFor(key, r)}${dur}.`;
    }
  }
}

/** The rule that puts an indicator in Caution or Warning, in plain words. Every limit is a demo value. */
export function ruleText(key: IndicatorKey, ev: Evaluation): string {
  const def = INDICATORS[key];
  const word = ev.status === "warning" ? "Warning" : "Caution";
  if (key === "mood") return ev.twoDays ? "Rule: Warning when mood is Very low on two days running." : "Rule: Caution when mood is Low, or Very low once.";
  if (key === "exercise") return ev.twoDays ? "Rule: Warning when exercise is below 60 minutes on two days running." : "Rule: Caution when exercise is below the target of 120 minutes a day.";
  const rel = ev.side === "above" ? (ev.inclusive ? "at or above" : "above") : "below";
  const subject = ev.component ? `${ev.component} blood pressure` : def.phrase;
  const when = key === "glucose" && ev.latest?.timing === "after-meal" ? " after a meal" : "";
  return `Rule: ${word} when ${subject}${when} is ${rel} ${fmtLimit(key, ev.limit ?? 0)}.`;
}
