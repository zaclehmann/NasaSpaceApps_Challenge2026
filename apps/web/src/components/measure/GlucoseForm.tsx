// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { useState } from "react";
import type { GlucoseTiming } from "@missionvitals/shared";
import { NumericInput } from "../ui/NumericInput";
import { Scale } from "../ui/Scale";
import { rangeError, type NewReading } from "./BloodPressureForm";

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
        const err = rangeError("Blood glucose", value, 20, 600, "mg/dL");
        setError(err);
        if (err) return;
        onSave({ value: Number(value), timing: TIMINGS[timing - 1], device: "glucometer" });
      }}
    >
      <NumericInput label="Blood glucose" unit="mg/dL" value={value} onChange={setValue} error={error} autoFocus />
      <Scale legend="When did you take it?" labels={TIMING_LABELS} value={timing} onChange={setTiming} />
      <p className="type-caption text-subtle-foreground">The demo range of 70 to 110 mg/dL is for fasting readings.</p>
    </form>
  );
}

export function SimpleValueForm({ formId, label, unit, min, max, device, onSave }: { formId: string; label: string; unit: string; min: number; max: number; device: NewReading["device"]; onSave: (r: NewReading) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  return (
    <form
      id={formId}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const err = rangeError(label, value, min, max, unit);
        setError(err);
        if (err) return;
        onSave({ value: Number(value), device });
      }}
    >
      <NumericInput label={label} unit={unit} value={value} onChange={setValue} error={error} autoFocus />
    </form>
  );
}
