// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { useState } from "react";
import { DIASTOLIC_BELOW_SYSTOLIC, ENTRY_RANGES, fieldError, type Reading } from "@missionvitals/shared";
import { NumericInput } from "../ui/NumericInput";

export type NewReading = Omit<Reading, "t">;

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
          sys: fieldError(ENTRY_RANGES.systolic, sys),
          dia: fieldError(ENTRY_RANGES.diastolic, dia) ?? (Number(dia) >= Number(sys) ? DIASTOLIC_BELOW_SYSTOLIC : undefined),
          pulse: fieldError(ENTRY_RANGES.pulse, pulse),
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
