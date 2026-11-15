// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { useState } from "react";
import type { GlucoseTiming } from "@missionvitals/shared";
import { NumericInput } from "../ui/NumericInput";
import { Scale } from "../ui/Scale";
import { ENTRY_RANGES, fieldError, type EntryRange } from "@missionvitals/shared";
import type { NewReading } from "./BloodPressureForm";

const TIMINGS: GlucoseTiming[] = ["fasting", "before-meal", "after-meal"];
const TIMING_LABELS = ["Fasting", "Before a meal", "After a meal"] as const;

export function GlucoseForm({ formId, onSave }: { formId: string; onSave: (r: NewReading) => void }) {
  const [value, setValue] = useState("");
  const [timing, setTiming] = useState(1);
  const [error, setError] = useState<string>();
  return (
    <form
      id={formId}
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const err = fieldError(ENTRY_RANGES.glucose, value);
        setError(err);
        if (err) return;
        onSave({ value: Number(value), timing: TIMINGS[timing - 1], device: "glucometer" });
      }}
    >
      <NumericInput label="Blood glucose" unit="mg/dL" value={value} onChange={setValue} error={error} autoFocus />
      <Scale legend="When did you take it?" labels={TIMING_LABELS} value={timing} onChange={setTiming} />
      <p className="type-caption text-subtle-foreground">Demo range: 70 to 110 mg/dL fasting or before a meal, 70 to 140 mg/dL after a meal.</p>
    </form>
  );
}

/** One number with its shared entry range (entryRanges.ts); `label` is the field's own wording. */
export function SimpleValueForm({ formId, label, range, device, onSave }: { formId: string; label: string; range: EntryRange; device: NewReading["device"]; onSave: (r: NewReading) => void }) {
  const unit = range.unit;
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  return (
    <form
      id={formId}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const err = fieldError(range, value);
        setError(err);
        if (err) return;
        onSave({ value: Number(value), device });
      }}
    >
      <NumericInput label={label} unit={unit} value={value} onChange={setValue} error={error} autoFocus />
    </form>
  );
}
