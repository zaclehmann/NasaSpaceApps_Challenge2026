// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Guided measurement (ui.md 5.5): Prepare, Enter, Result. Written like a flight procedure.
import { useId, useState } from "react";
import { GUIDANCE, INDICATORS, ROUTINE, statusLine, type IndicatorKey } from "@missionvitals/shared";
import { useSource } from "../../data/DataProvider";
import type { HealthView } from "../../data/health";
import { useUi, type ProcedureRequest } from "../../state/ui";
import { INDICATOR_ICON } from "../indicators/icons";
import { EscalationLevels } from "../panel/EscalationLevels";
import { Steps, WhatToDo } from "../panel/WhatToDo";
import { StatusBadge } from "../status/StatusBadge";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { BloodPressureForm, type NewReading } from "./BloodPressureForm";
import { GlucoseForm, SimpleValueForm } from "./GlucoseForm";
import { MoodForm } from "./MoodForm";

const EXERCISE = {
  name: "Exercise log",
  procedureId: "HM-9",
  equipment: "Exercise device",
  steps: ["Complete today's planned session.", "Note how long you exercised.", "Wipe down the equipment and stow it."],
};

function Body({ request, view }: { request: ProcedureRequest; view: HealthView }) {
  const source = useSource();
  const { closeProcedure, showToast, setReportOpen } = useUi();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const formId = useId();
  const isExercise = request.kind === "exercise";
  const key = request.kind as IndicatorKey;
  const proc = isExercise ? EXERCISE : { name: INDICATORS[key].name, ...GUIDANCE[key].howToMeasure };
  const Icon = INDICATOR_ICON[request.kind];
  const state = isExercise ? undefined : view.indicators[key];

  const save = (r: NewReading) => {
    if (isExercise) {
      const task = request.taskId ?? ROUTINE.find((t) => t.kind === "exercise")?.id;
      if (task) source.completeTask(view.astronaut.id, task);
      showToast("Session logged");
    } else {
      source.addReading(view.astronaut.id, key, r, request.taskId);
      showToast("Reading saved");
    }
    setStep(3);
  };

  const footer =
    step === 1 ? (
      <Button variant="primary" onClick={() => setStep(2)}>
        I'm ready
      </Button>
    ) : step === 2 ? (
      <>
        <Button onClick={() => setStep(1)}>Back</Button>
        <Button variant="primary" type="submit" form={formId}>
          {isExercise ? "Log session" : "Save reading"}
        </Button>
      </>
    ) : (
      <Button variant="primary" onClick={closeProcedure}>
        Done
      </Button>
    );

  return (
    <Dialog open onOpenChange={(o) => !o && closeProcedure()} title={`${proc.name}, Procedure ${proc.procedureId}`} subtitle={`Step ${step} of 3`} footer={footer}>
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="type-body font-semibold">Prepare</h3>
          <Steps steps={proc.steps} />
          <p className="flex items-center gap-2 type-small text-muted-foreground">
            <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
            Equipment: {proc.equipment.toLowerCase()}
          </p>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="type-body font-semibold">{request.kind === "mood" ? "Check in" : "Enter the reading"}</h3>
          {request.kind === "bp" && <BloodPressureForm formId={formId} onSave={save} />}
          {request.kind === "glucose" && <GlucoseForm formId={formId} onSave={save} />}
          {request.kind === "mood" && <MoodForm formId={formId} onSave={save} />}
          {request.kind === "sleep" && <SimpleValueForm formId={formId} label="Hours slept" unit="h" min={0} max={16} device="self" onSave={save} />}
          {isExercise && <SimpleValueForm formId={formId} label="Session length" unit="min" min={1} max={240} device="self" onSave={save} />}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-5">
          {state ? (
            <>
              <div>
                <StatusBadge status={state.status} className="type-small" />
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="type-value-xl">{state.valueText}</span>
                  {key !== "mood" && <span className="type-label text-muted-foreground">{state.def.unit}</span>}
                </p>
                <p className="mt-2 type-body">{statusLine(key, state.ev, view.now)}</p>
              </div>
              <WhatToDo steps={GUIDANCE[key].whatToDo[state.status]} />
              {(state.status === "caution" || state.status === "warning") && (
                <EscalationLevels
                  escalation={GUIDANCE[key].escalation}
                  current={state.status === "warning" ? "surgeon" : "self"}
                  onReport={() => {
                    closeProcedure();
                    setReportOpen(true);
                  }}
                />
              )}
            </>
          ) : (
            <p className="type-body">Session logged. Today's routine is updated.</p>
          )}
        </div>
      )}
    </Dialog>
  );
}

export function ProcedureDialog({ view }: { view: HealthView }) {
  const { procedure } = useUi();
  if (!procedure) return null;
  return <Body key={`${procedure.kind}-${procedure.taskId ?? ""}`} request={procedure} view={view} />;
}
