// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// What a person can physically enter for each reading. These are entry limits (typing errors, impossible values),
// not health thresholds: a value inside them can still be Caution or Warning. The forms and the API use the same
// ranges and the same words, so a refused value reads the same on screen and in a 400 from the server.

export interface EntryRange {
  /** The name in the message: "Systolic must be between 60 and 250 mmHg". */
  label: string;
  min: number;
  max: number;
  unit: string;
  /** Whole numbers only (mood and stress). */
  integer?: boolean;
}

export const ENTRY_RANGES = {
  systolic: { label: "Systolic", min: 60, max: 250, unit: "mmHg" },
  diastolic: { label: "Diastolic", min: 30, max: 150, unit: "mmHg" },
  pulse: { label: "Pulse", min: 30, max: 220, unit: "bpm" },
  temp: { label: "Temperature", min: 30, max: 43, unit: "°C" },
  glucose: { label: "Blood glucose", min: 20, max: 600, unit: "mg/dL" },
  sleep: { label: "Hours slept", min: 0, max: 16, unit: "h" },
  exercise: { label: "Exercise today", min: 0, max: 300, unit: "min" },
  mood: { label: "Mood", min: 1, max: 5, unit: "", integer: true },
  stress: { label: "Stress", min: 1, max: 5, unit: "", integer: true },
} as const satisfies Record<string, EntryRange>;

export type EntryRangeKey = keyof typeof ENTRY_RANGES;

/** "Systolic must be between 60 and 250 mmHg"; "Mood must be a whole number from 1 to 5". */
export function rangeMessage(r: EntryRange): string {
  if (r.integer) return `${r.label} must be a whole number from ${r.min} to ${r.max}`;
  return `${r.label} must be between ${r.min} and ${r.max}${r.unit ? ` ${r.unit}` : ""}`;
}

/** Undefined when `value` is inside the range, otherwise the message. */
export function outOfRange(r: EntryRange, value: number): string | undefined {
  if (!Number.isFinite(value) || value < r.min || value > r.max || (r.integer && !Number.isInteger(value))) return rangeMessage(r);
  return undefined;
}

/** For a form field: also asks for a missing value ("Enter systolic in mmHg"). */
export function fieldError(r: EntryRange, raw: string): string | undefined {
  if (raw.trim() === "" || Number.isNaN(Number(raw))) return `Enter ${r.label.toLowerCase()}${r.unit ? ` in ${r.unit}` : ""}`;
  return outOfRange(r, Number(raw));
}

/** The diastolic must be below the systolic. */
export const DIASTOLIC_BELOW_SYSTOLIC = "Diastolic must be lower than systolic";

/** The field and message for the first value of an entered reading outside its range, or undefined. */
export function readingRangeError(indicator: string, r: { value: number; value2?: number; pulse?: number; stress?: number }): { field: string; message: string } | undefined {
  const check = (field: string, key: EntryRangeKey, v: number | undefined): { field: string; message: string } | undefined => {
    const message = v === undefined ? undefined : outOfRange(ENTRY_RANGES[key], v);
    return message ? { field, message } : undefined;
  };
  switch (indicator) {
    case "bp": {
      if (r.value2 === undefined) return { field: "value2", message: "Enter diastolic in mmHg" };
      return check("value", "systolic", r.value) || check("value2", "diastolic", r.value2) || (r.value2 >= r.value ? { field: "value2", message: DIASTOLIC_BELOW_SYSTOLIC } : undefined) || check("pulse", "pulse", r.pulse);
    }
    case "temp":
    case "glucose":
    case "sleep":
    case "exercise":
      return check("value", indicator, r.value);
    case "mood":
      return check("value", "mood", r.value) || check("stress", "stress", r.stress);
    default:
      return undefined;
  }
}
