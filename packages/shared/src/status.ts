// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The status function. Pure: same inputs, same answer. All limits are DEMO values (see indicators.ts).
import { INDICATORS, formatValue } from "./indicators";
import { DAY, formatDuration, startOfDay } from "./time";
import type { IndicatorKey, Reading, Status } from "./types";

export type Side = "above" | "below";
export type Level = "ok" | "caution" | "warning";

export interface StatusContext {
  /** Current MET in seconds. Defaults to the time of the latest reading. */
  now?: number;
  /** State of the routine task for this indicator, if it has one. */
  routine?: "none" | "due" | "overdue";
}

export interface Evaluation {
  status: Status;
  reason: "in-range" | "trend" | "overdue" | "out-of-range" | "silent" | "not-taken";
  side?: Side;
  /** The demo limit that was crossed or is being approached. */
  limit?: number;
  /** True when the rule includes the limit itself ("at or above"). */
  inclusive?: boolean;
  /** For blood pressure: which number drove the status. */
  component?: "systolic" | "diastolic";
  /** Mood only: Very low on two days running. */
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
      return OK;
    }
    case "glucose":
      if (v < 55) return { level: "warning", side: "below", limit: 55 };
      if (v > 180) return { level: "warning", side: "above", limit: 180 };
      if (v < 70) return { level: "caution", side: "below", limit: 70 };
      if (v > 110) return { level: "caution", side: "above", limit: 110 };
      return OK;
    case "sleep":
      if (v < 5) return { level: "warning", side: "below", limit: 5 };
      if (v < 6) return { level: "caution", side: "below", limit: 6 };
      return OK;
    case "mood": {
      if (v >= 3) return OK;
      if (v <= 1) {
        // Warning needs a 1 on the mission day before as well.
        const dayStart = startOfDay(r.t);
        for (let j = i - 1; j >= 0; j--) {
          const p = readings[j];
          if (p.t >= dayStart) continue;
          if (p.t >= dayStart - DAY && Math.round(p.value) <= 1) return { level: "warning", side: "below", limit: 3, twoDays: true };
          break;
        }
      }
      return { level: "caution", side: "below", limit: 3 };
    }
    case "radiation":
      if (v > 50) return { level: "warning", side: "above", limit: 50 };
      if (v >= 20) return { level: "caution", side: "above", limit: 20, inclusive: true };
      return OK;
  }
}

/**
 * Watch rule settings. A value is "near" a limit when it is within 10% of that limit.
 * For SpO2 and temperature, 10% of the limit would cover the whole healthy range,
 * so the margin is 10% of the in-range span instead (6 points and 1.5 degrees).
 * minChange is the smallest move toward the limit that counts as a trend, so noise does not.
 */
export const WATCH: Record<IndicatorKey, { margin?: number; minChange: number; arrowMin: number }> = {
  hr: { minChange: 5, arrowMin: 3 },
  spo2: { margin: 0.6, minChange: 1, arrowMin: 1 },
  temp: { margin: 0.15, minChange: 0.2, arrowMin: 0.1 },
  bp: { minChange: 4, arrowMin: 4 },
  glucose: { minChange: 5, arrowMin: 5 },
  sleep: { minChange: 0.3, arrowMin: 0.3 },
  mood: { minChange: 0.3, arrowMin: 1 },
  radiation: { minChange: 1.5, arrowMin: 0.5 },
};

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

type Pick = (r: Reading) => number;
const primary: Pick = (r) => r.value;
const secondary: Pick = (r) => r.value2 ?? NaN;

/**
 * How far the value has moved over the trend window.
 * Live sources: mean of the last 10 minutes minus the mean from 50 to 70 minutes ago ("over the last hour").
 * Entered readings: the latest reading minus the mean of up to five readings before it.
 */
export function trendChange(key: IndicatorKey, readings: readonly Reading[], now: number, pick: Pick = primary): number | undefined {
  if (!readings.length) return undefined;
  if (INDICATORS[key].source === "entered") {
    const prev = readings.slice(Math.max(0, readings.length - 6), readings.length - 1).map(pick).filter((x) => !Number.isNaN(x));
    if (!prev.length) return undefined;
    return pick(readings[readings.length - 1]) - mean(prev);
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

function approaching(key: IndicatorKey, readings: readonly Reading[], now: number): Pick_ | undefined {
  const def = INDICATORS[key];
  const w = WATCH[key];
  const latest = readings[readings.length - 1];
  const candidates: { limit: number; side: Side; pick: Pick; component?: "systolic" | "diastolic" }[] = [];
  if (key === "bp") {
    candidates.push({ limit: 135, side: "above", pick: primary, component: "systolic" });
    candidates.push({ limit: 85, side: "above", pick: secondary, component: "diastolic" });
    candidates.push({ limit: 90, side: "below", pick: primary, component: "systolic" });
  } else {
    if (def.high !== undefined) candidates.push({ limit: def.high, side: "above", pick: primary });
    if (def.low !== undefined) candidates.push({ limit: def.low, side: "below", pick: primary });
  }
  for (const c of candidates) {
    const v = round(c.pick(latest), def.decimals);
    const margin = w.margin ?? 0.1 * c.limit;
    const near = c.side === "above" ? v >= c.limit - margin : v <= c.limit + margin;
    if (!near) continue;
    const change = trendChange(key, readings, now, c.pick);
    if (change === undefined) continue;
    const toward = c.side === "above" ? change : -change;
    if (toward >= w.minChange) return { side: c.side, limit: c.limit, component: c.component };
  }
  return undefined;
}
type Pick_ = { side: Side; limit: number; component?: "systolic" | "diastolic" };

/** MET when the current unbroken out-of-range run on this side began. */
function runStart(key: IndicatorKey, readings: readonly Reading[], side: Side | undefined): number {
  const def = INDICATORS[key];
  const last = readings.length - 1;
  let since = readings[last].t;
  if (def.source === "entered") return since;
  for (let i = last - 1; i >= 0; i--) {
    if (readings[i + 1].t - readings[i].t > 3 * def.expectedIntervalSec) break;
    const c = classify(key, readings, i);
    if (c.level === "ok" || c.side !== side) break;
    since = readings[i].t;
  }
  return since;
}

/**
 * Full evaluation of an indicator. `readings` must be in time order, oldest first.
 *
 * - No data: a live source silent for 3x its expected interval, or an entered measurement not taken today.
 * - Warning and Caution: from the demo thresholds table.
 * - Watch: in range, but within 10% of a limit and moving toward it, or a routine measurement overdue.
 */
export function evaluate(key: IndicatorKey, readings: readonly Reading[], ctx: StatusContext = {}): Evaluation {
  const def = INDICATORS[key];
  const latest = readings.length ? readings[readings.length - 1] : undefined;
  const now = ctx.now ?? latest?.t ?? 0;
  const routine = ctx.routine ?? "none";

  if (def.source === "entered") {
    const takenToday = latest !== undefined && latest.t >= startOfDay(now);
    if (!takenToday) {
      return routine === "overdue" ? { status: "watch", reason: "overdue", latest } : { status: "nodata", reason: "not-taken", latest };
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
      since: runStart(key, readings, c.side),
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

/** Direction for the small arrow in the indicator list: the last minute against 5 to 10 minutes ago, or the previous entry. */
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
    case "not-taken":
      return "Not measured yet today.";
    case "overdue":
      return r && r.t >= startOfDay(now) ? "In range at the last reading. A routine check is overdue." : "Today's check is overdue.";
    case "in-range":
      return `Inside your demo range of ${def.rangeText}.`;
    case "trend": {
      if (key === "mood") return "In range, but lower than your recent check-ins.";
      const verb = ev.side === "above" ? "rising" : "falling";
      const span = def.source === "entered" ? "across your recent readings" : "over the last hour";
      const what = ev.component ? `${ev.component === "systolic" ? "Systolic" : "Diastolic"} is ${verb}` : `In range, but ${verb}`;
      return `${what} toward the demo limit of ${fmtLimit(key, ev.limit ?? 0)} ${span}.`;
    }
    case "out-of-range": {
      const dur = def.source !== "entered" && ev.since !== undefined && r ? ` for ${formatDuration(Math.max(r.t - ev.since, def.expectedIntervalSec))}` : "";
      const side = ev.side === "above" ? (ev.inclusive ? "At or above" : "Above") : "Below";
      if (key === "mood") {
        return ev.twoDays ? "Very low on two days running. Below your demo range of Okay or better." : `${formatValue("mood", r?.value ?? 1)} today. Below your demo range of Okay or better.`;
      }
      if (key === "bp" && r) {
        const which = ev.component === "diastolic" ? `Diastolic ${Math.round(r.value2 ?? 0)}` : `Systolic ${Math.round(r.value)}`;
        const rel = ev.side === "above" ? (ev.inclusive ? "at or above" : "above") : "below";
        const what = ev.status === "warning" ? "the critical demo limit" : "the demo limit";
        return `${which} mmHg is ${rel} ${what} of ${ev.limit} mmHg.`;
      }
      if (ev.status === "warning") return `${side} the critical demo limit of ${fmtLimit(key, ev.limit ?? 0)}${dur}.`;
      // One-sided ranges read better as a limit than as a range.
      if (def.low === undefined || def.high === undefined) return `${side} the demo limit of ${fmtLimit(key, ev.limit ?? 0)}${dur}.`;
      return `${side} your demo range of ${def.rangeText}${dur}.`;
    }
  }
}

/** The rule that puts an indicator in Caution or Warning, in plain words. Every limit is a demo value. */
export function ruleText(key: IndicatorKey, ev: Evaluation): string {
  const def = INDICATORS[key];
  const word = ev.status === "warning" ? "Warning" : "Caution";
  if (key === "mood") return ev.twoDays ? "Demo rule: Warning when mood is Very low on two days running." : "Demo rule: Caution when mood is Low, or Very low once.";
  const rel = ev.side === "above" ? (ev.inclusive ? "at or above" : "above") : "below";
  const subject = ev.component ? `${ev.component} blood pressure` : def.phrase;
  return `Demo rule: ${word} when ${subject} is ${rel} ${fmtLimit(key, ev.limit ?? 0)}.`;
}
