// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Indicator catalogue. Every range here is a DEMO value for this prototype, not a NASA limit.
import type { DeviceId, IndicatorKey, IndicatorSource } from "./types";
import type { RegionId } from "./regions";

export type ChartForm = "line" | "dots" | "bp" | "bars";

export interface IndicatorDef {
  key: IndicatorKey;
  name: string;
  /** Lower-case name for use inside sentences. */
  phrase: string;
  /** Short name for callouts on the body figure. */
  short: string;
  unit: string;
  source: IndicatorSource;
  device: DeviceId;
  decimals: number;
  /** Seconds between readings. No reading for 3x this means No data (live sources). */
  expectedIntervalSec: number;
  region: RegionId;
  procedureId: string;
  chart: ChartForm;
  /** Demo in-range limits, used for the chart band and status lines. */
  low?: number;
  high?: number;
  /** Plain-language demo range for status lines, e.g. "50 to 110 bpm". */
  rangeText: string;
  /** Rows for the demo thresholds table on the Methodology page. */
  table: { inRange: string; caution: string; warning: string };
}

export const INDICATORS: Record<IndicatorKey, IndicatorDef> = {
  hr: {
    key: "hr",
    short: "HR",
    name: "Heart rate",
    phrase: "heart rate",
    unit: "bpm",
    source: "live",
    device: "shirt",
    decimals: 0,
    expectedIntervalSec: 5,
    region: "heart",
    procedureId: "HM-1",
    chart: "line",
    low: 50,
    high: 110,
    rangeText: "50 to 110 bpm",
    table: { inRange: "50 to 110", caution: "40 to 49, or 111 to 140", warning: "Below 40, or above 140" },
  },
  spo2: {
    key: "spo2",
    short: "SpO₂",
    name: "SpO₂",
    phrase: "SpO₂",
    unit: "%",
    source: "live",
    device: "shirt",
    decimals: 0,
    expectedIntervalSec: 5,
    region: "lungs",
    procedureId: "HM-2",
    chart: "line",
    low: 94,
    rangeText: "94 % or more",
    table: { inRange: "94 or more", caution: "90 to 93", warning: "Below 90" },
  },
  temp: {
    key: "temp",
    short: "Temp",
    name: "Temperature",
    phrase: "temperature",
    unit: "°C",
    source: "live",
    device: "shirt",
    decimals: 1,
    expectedIntervalSec: 5,
    region: "immune",
    procedureId: "HM-5",
    chart: "line",
    low: 36.0,
    high: 37.5,
    rangeText: "36.0 to 37.5 °C",
    table: { inRange: "36.0 to 37.5", caution: "35.5 to 35.9, or 37.6 to 38.4", warning: "Below 35.5, or 38.5 and above" },
  },
  bp: {
    key: "bp",
    short: "BP",
    name: "Blood pressure",
    phrase: "blood pressure",
    unit: "mmHg",
    source: "entered",
    device: "cuff",
    decimals: 0,
    expectedIntervalSec: 12 * 3600,
    region: "heart",
    procedureId: "HM-3",
    chart: "bp",
    low: 90,
    high: 135,
    rangeText: "systolic 90 to 135 and diastolic 85 or less, in mmHg",
    table: {
      inRange: "Systolic 90 to 135 and diastolic 85 or less",
      caution: "Systolic 136 to 159 or 80 to 89, or diastolic 86 to 99",
      warning: "Systolic 160 or more or below 80, or diastolic 100 or more",
    },
  },
  glucose: {
    key: "glucose",
    short: "Glucose",
    name: "Blood glucose",
    phrase: "blood glucose",
    unit: "mg/dL",
    source: "entered",
    device: "glucometer",
    decimals: 0,
    expectedIntervalSec: 24 * 3600,
    region: "gut",
    procedureId: "HM-4",
    chart: "dots",
    low: 70,
    high: 110,
    rangeText: "70 to 110 mg/dL fasting",
    table: { inRange: "70 to 110, fasting", caution: "55 to 69, or 111 to 180", warning: "Below 55, or above 180" },
  },
  sleep: {
    key: "sleep",
    short: "Sleep",
    name: "Sleep",
    phrase: "sleep",
    unit: "h",
    source: "entered",
    device: "self",
    decimals: 1,
    expectedIntervalSec: 24 * 3600,
    region: "brain",
    procedureId: "HM-6",
    chart: "bars",
    low: 6,
    rangeText: "6 hours or more",
    table: { inRange: "6 or more", caution: "5.0 to 5.9", warning: "Below 5" },
  },
  mood: {
    key: "mood",
    short: "Mood",
    name: "Mood",
    phrase: "mood",
    unit: "of 5",
    source: "entered",
    device: "self",
    decimals: 0,
    expectedIntervalSec: 24 * 3600,
    region: "brain",
    procedureId: "HM-7",
    chart: "dots",
    low: 3,
    rangeText: "Okay (3 of 5) or better",
    table: { inRange: "3 or more", caution: "2, or 1 once", warning: "1 on two days running" },
  },
  radiation: {
    key: "radiation",
    short: "Dose",
    name: "Habitat radiation",
    phrase: "habitat radiation",
    unit: "µGy/h",
    source: "habitat",
    device: "dosimeter",
    decimals: 1,
    expectedIntervalSec: 60,
    region: "whole",
    procedureId: "HM-8",
    chart: "line",
    high: 20,
    rangeText: "below 20 µGy/h",
    table: { inRange: "Below 20", caution: "20 to 50", warning: "Above 50" },
  },
};

export const INDICATOR_KEYS = Object.keys(INDICATORS) as IndicatorKey[];

/** List groups in display order (ui.md 5.2). */
export const INDICATOR_GROUPS: { source: IndicatorSource; title: string; keys: IndicatorKey[] }[] = [
  { source: "live", title: "Live from your shirt", keys: ["hr", "spo2", "temp"] },
  { source: "entered", title: "Entered by you today", keys: ["bp", "glucose", "sleep", "mood"] },
  { source: "habitat", title: "Habitat", keys: ["radiation"] },
];

export const MOOD_WORDS = ["Very low", "Low", "Okay", "Good", "Very good"] as const;
export const STRESS_WORDS = ["Very low", "Low", "Some", "High", "Very high"] as const;
export const MOOD_TAGS = ["Tired", "Lonely", "Irritable", "Unfocused", "Motivated", "Connected"] as const;

/** Format a reading's value with the right decimals, without the unit. */
export function formatValue(key: IndicatorKey, value: number, value2?: number): string {
  const def = INDICATORS[key];
  if (key === "bp") return `${Math.round(value)}/${Math.round(value2 ?? 0)}`;
  if (key === "mood") return MOOD_WORDS[Math.min(5, Math.max(1, Math.round(value))) - 1];
  return value.toFixed(def.decimals);
}

export const DEVICE_NAMES: Record<DeviceId, string> = {
  shirt: "Shirt",
  cuff: "BP cuff",
  glucometer: "Glucometer",
  dosimeter: "Dosimeter",
  self: "Self-report",
};

export const WINDOW_SEC: Record<import("./types").ChartWindow, number> = { "1h": 3600, "24h": 86400, "7d": 7 * 86400, "14d": 14 * 86400, "30d": 30 * 86400 };

/** Seconds between samples a data source returns for a live or habitat indicator in each chart window. */
export function sampleStepSec(key: IndicatorKey, window: import("./types").ChartWindow): number {
  const habitat = INDICATORS[key].source === "habitat";
  switch (window) {
    case "1h":
      return habitat ? 60 : 5;
    case "24h":
      return habitat ? 600 : 120;
    case "7d":
      return habitat ? 3600 : 900;
    case "14d":
      return habitat ? 2 * 3600 : 1800;
    case "30d":
      return habitat ? 4 * 3600 : 3600;
  }
}
