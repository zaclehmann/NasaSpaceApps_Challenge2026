// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { useState } from "react";
import type { Reading } from "@missionvitals/shared";
import { NumericInput } from "../ui/NumericInput";

export type NewReading = Omit<Reading, "t">;

/** Returns an error message, or undefined when the value is inside the accepted entry range. */
export function rangeError(name: string, raw: string, min: number, max: number, unit: string): string | undefined {
  const v = Number(raw);
  if (raw.trim() === "" || Number.isNaN(v)) return `Enter ${name.toLowerCase()} in ${unit}`;
  if (v < min || v > max) return `${name} must be between ${min} and ${max} ${unit}`;
  return undefined;
}

export function BloodPressureForm({ formId, onSave }: { formId: string; onSave: (r: NewReading) => void }) {
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [pulse, setPulse] = useState("");
  const [errors, setErrors] = useState<{ sys?: string; dia?: string; pulse?: string }>({});
  return (
    <form
      id={formId}
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const next = {
          sys: rangeError("Systolic", sys, 60, 250, "mmHg"),
          dia: rangeError("Diastolic", dia, 30, 150, "mmHg") ?? (Number(dia) >= Number(sys) ? "Diastolic must be lower than systolic" : undefined),
          pulse: rangeError("Pulse", pulse, 30, 220, "bpm"),
        };
        setErrors(next);
        if (next.sys || next.dia || next.pulse) return;
        onSave({ value: Number(sys), value2: Number(dia), pulse: Number(pulse), device: "cuff" });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumericInput label="Systolic" unit="mmHg" value={sys} onChange={setSys} error={errors.sys} autoFocus />
        <NumericInput label="Diastolic" unit="mmHg" value={dia} onChange={setDia} error={errors.dia} />
      </div>
      <NumericInput label="Pulse" unit="bpm" value={pulse} onChange={setPulse} error={errors.pulse} />
    </form>
  );
}
