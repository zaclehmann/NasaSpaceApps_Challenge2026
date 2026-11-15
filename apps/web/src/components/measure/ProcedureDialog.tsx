// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Guided measurement (ui.md 5.5): Prepare, Enter, Result. Written like a flight procedure.
// The result step offers the next routine task that is due, so the morning checks run as one flow.
import { useId, useState } from "react";
import { ENTRY_RANGES, GUIDANCE, INDICATORS, statusLine, whatToDoFor } from "@missionvitals/shared";
import { useSource } from "../../data/DataProvider";
import type { HealthView } from "../../data/health";
import { useUi, type ProcedureRequest } from "../../state/ui";
import { INDICATOR_ICON } from "../indicators/icons";
import { taskStatusText } from "../layout/RoutineList";
import { Steps } from "../panel/WhatToDo";
import { StatusBadge } from "../status/StatusBadge";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { BloodPressureForm, type NewReading } from "./BloodPressureForm";
import { GlucoseForm, SimpleValueForm } from "./GlucoseForm";
import { MoodForm } from "./MoodForm";

const STEP_NAMES = ["Prepare", "Enter", "Result"];

function Body({ request, view }: { request: ProcedureRequest; view: HealthView }) {
  const source = useSource();
  const { closeProcedure, startProcedure, showToast, setReportOpen } = useUi();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const formId = useId();
  const key = request.kind;
  const isExercise = key === "exercise";
  const proc = { name: INDICATORS[key].name, ...GUIDANCE[key].howToMeasure };
  const Icon = INDICATOR_ICON[key];
  const state = view.indicators[key];
  const flagged = state?.status === "caution" || state?.status === "warning";
  const next = step === 3 ? view.routine.entries.find((e) => e.state.kind === "overdue" || e.state.kind === "due") : undefined;

  const save = (r: NewReading) => {
    source.addReading(view.astronaut.id, key, r, request.taskId);
    showToast(isExercise ? "Exercise confirmed" : "Reading saved");
    setStep(3);
  };

  const footer =
    step === 1 ? (
      <Button variant="primary" autoFocus onClick={() => setStep(2)}>
        I'm ready
      </Button>
    ) : step === 2 ? (
      <>
        <Button onClick={() => setStep(1)}>Back</Button>
        <Button variant="primary" type="submit" form={formId}>
          {isExercise ? "Log exercise" : "Save reading"}
        </Button>
      </>
    ) : (
      <>
        {flagged && (
          <Button
            onClick={() => {
              closeProcedure();
              setReportOpen(true);
            }}
          >
            Send report
          </Button>
        )}
        {next && <Button onClick={() => startProcedure({ kind: next.task.kind, taskId: next.task.id })}>Start next</Button>}
        <Button variant="primary" autoFocus onClick={closeProcedure}>
          Done
        </Button>
      </>
    );

  return (
    <Dialog open onOpenChange={(o) => !o && closeProcedure()} title={`${proc.name}, Procedure ${proc.procedureId}`} subtitle={`Step ${step} of 3, ${STEP_NAMES[step - 1].toLowerCase()}`} footer={footer}>
      {step === 1 && (
        <div className="space-y-4">
          <Steps steps={proc.steps} label="Prepare" />
          <p className="flex items-center gap-2 type-small text-muted-foreground">
            <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
            Equipment: {proc.equipment.toLowerCase()}
          </p>
        </div>
      )}
      {step === 2 && (
        <>
          {request.kind === "bp" && <BloodPressureForm formId={formId} onSave={save} />}
          {request.kind === "glucose" && <GlucoseForm formId={formId} onSave={save} />}
          {request.kind === "mood" && <MoodForm formId={formId} onSave={save} />}
          {request.kind === "temp" && <SimpleValueForm formId={formId} label="Temperature" range={ENTRY_RANGES.temp} device="thermometer" onSave={save} />}
          {request.kind === "sleep" && <SimpleValueForm formId={formId} label="Hours slept" range={ENTRY_RANGES.sleep} device="self" onSave={save} />}
          {isExercise && <SimpleValueForm formId={formId} label="Exercise today, from the shirt" range={ENTRY_RANGES.exercise} device="shirt" onSave={save} />}
        </>
      )}
      {step === 3 && (
        <div className="space-y-4">
          {state.valueText ? (
            <>
              <div>
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                  <p className="flex items-baseline gap-1.5">
                    <span className="type-value-xl">{state.valueText}</span>
                    {key !== "mood" && <span className="type-label text-muted-foreground">{state.def.unit}</span>}
                  </p>
                  <StatusBadge status={state.status} className="pb-1.5 type-small" />
                </div>
                <p className="mt-1.5 type-small">{statusLine(key, state.ev, view.now)}</p>
              </div>
              <div>
                <h3 className="mb-1.5 type-small font-semibold">What to do now</h3>
                <Steps steps={whatToDoFor(key, state.status)} />
              </div>
            </>
          ) : (
            <p className="type-body">Saved. Today's routine is updated.</p>
          )}
          <p className="border-t border-border pt-3 type-small text-muted-foreground">
            {next ? (
              <>
                Next in your routine: <span className="font-medium text-foreground">{next.task.label}</span>, {taskStatusText(next, view.now).toLowerCase()}.
              </>
            ) : (
              "Nothing else in your routine is due right now."
            )}
          </p>
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
