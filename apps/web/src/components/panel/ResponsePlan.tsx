// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// What to do now (ui.md 5.3, 5.6): the steps for the current state as a checklist.
// Ticking a step records its time in the alert's log. Acknowledge quiets the alert without hiding it.
import * as Popover from "@radix-ui/react-popover";
import clsx from "clsx";
import { Check } from "lucide-react";
import { useState } from "react";
import { formatClock, whatToDoFor, type Alert, type AlertActionKind, type IndicatorKey } from "@missionvitals/shared";
import { useSource } from "../../data/DataProvider";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { Button } from "../ui/Button";

const LOGGED: Record<Exclude<AlertActionKind, "note" | "step">, string> = {
  remeasured: "Re-measured",
  "checked-sensor": "Checked the sensor",
  "contacted-cmo": "Contacted the crew medical officer",
};

export function actionText(kind: AlertActionKind, note?: string): string {
  if (kind === "note") return `Note: ${note ?? ""}`;
  if (kind === "step") return `Done: ${note ?? ""}`;
  return LOGGED[kind];
}

function LogMenu({ alert, live }: { alert: Alert; live: boolean }) {
  const source = useSource();
  const { showToast } = useUi();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const log = (kind: AlertActionKind, text?: string) => {
    source.logAction(alert.id, kind, text);
    showToast("Action logged");
    setOpen(false);
  };
  const item = "flex min-h-10 w-full items-center rounded-md px-3 text-left type-small hover:bg-muted max-xl:min-h-12";
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button size="sm">Log action</Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} className="z-50 w-64 rounded-lg bg-card p-2 text-foreground shadow-float outline-none">
          <button type="button" className={item} onClick={() => log("checked-sensor")}>
            Checked the sensor
          </button>
          <button type="button" className={item} onClick={() => log("contacted-cmo")}>
            Contacted the CMO
          </button>
          {live && (
            <button type="button" className={item} onClick={() => log("remeasured")}>
              Rested and re-checked
            </button>
          )}
          <form
            className="mt-1 flex gap-2 border-t border-border px-1 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!note.trim()) return;
              log("note", note.trim());
              setNote("");
            }}
          >
            <label className="sr-only" htmlFor={`note-${alert.id}`}>
              Note
            </label>
            <input
              id={`note-${alert.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note"
              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-card px-2.5 type-small outline-none placeholder:text-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring max-xl:h-12"
            />
            <Button size="sm" type="submit" className="max-xl:h-12">
              Save
            </Button>
          </form>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** The alert for an indicator, if one is active. */
export const alertFor = (view: HealthView, indicator: IndicatorKey): Alert | undefined => view.alerts.find((a) => a.indicator === indicator);

/** The main action for a reading with an unacknowledged alert. Lives in the panel header. */
export function AcknowledgeButton({ alert }: { alert: Alert }) {
  const source = useSource();
  const { showToast } = useUi();
  return (
    <Button
      variant="primary"
      size="sm"
      onClick={() => {
        source.acknowledgeAlert(alert.id);
        showToast("Alert acknowledged");
      }}
    >
      Acknowledge
    </Button>
  );
}

/** The actions that apply whatever tab is open. Lives in the panel footer. */
export function ResponseActions({ view, indicator }: { view: HealthView; indicator: IndicatorKey }) {
  const { setReportOpen } = useUi();
  const state = view.indicators[indicator];
  const alert = alertFor(view, indicator);
  const flagged = state.status === "caution" || state.status === "warning" || state.status === "watch" || state.ev.reason === "silent";
  if (!flagged && !alert) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={() => setReportOpen(true)}>
        Send report
      </Button>
      {alert && <LogMenu alert={alert} live={state.def.source !== "entered"} />}
      {alert?.acknowledged && <span className="ml-auto type-caption text-muted-foreground">Acknowledged {formatClock(alert.acknowledgedAt ?? alert.firedAt)} MET</span>}
    </div>
  );
}

/** What to do now: the steps for the current state as a checklist, the action log and the rule that fired. */
export function ResponsePlan({ view, indicator }: { view: HealthView; indicator: IndicatorKey }) {
  const source = useSource();
  const { startProcedure } = useUi();
  const state = view.indicators[indicator];
  const alert = alertFor(view, indicator);
  const steps = whatToDoFor(indicator, state.status);
  const [local, setLocal] = useState<Record<string, number>>({});
  const entered = state.def.source === "entered";

  // In range, or simply due: one plain line. The Measure button is in the panel header.
  if (state.status === "ok" || state.status === "due") {
    return <p className="type-small text-muted-foreground">{steps[0]}</p>;
  }

  const doneAt = (step: string) => alert?.actions.find((a) => a.kind === "step" && a.note === step)?.t ?? local[step];
  const tick = (step: string) => {
    if (doneAt(step) !== undefined) return;
    if (alert) source.logAction(alert.id, "step", step);
    else setLocal((x) => ({ ...x, [step]: view.now }));
  };
  const others = alert?.actions.filter((a) => a.kind !== "step") ?? [];

  return (
    <div>
      <ol>
        {steps.map((step, i) => {
          const at = doneAt(step);
          const done = at !== undefined;
          const canMeasure = entered && /measure|reading|check-in|sleep review/i.test(step);
          return (
            <li key={step} className="flex items-start gap-1">
              <button type="button" role="checkbox" aria-checked={done} onClick={() => tick(step)} className="flex min-h-9 min-w-0 flex-1 items-start gap-2.5 rounded-sm py-1.5 text-left type-small max-xl:min-h-12 max-xl:py-3">
                <span
                  aria-hidden="true"
                  className={clsx(
                    "mt-px flex size-[18px] shrink-0 items-center justify-center rounded-sm border text-[11px] leading-none font-medium transition-colors duration-[120ms]",
                    done ? "border-foreground bg-foreground text-background" : "border-border-strong text-muted-foreground",
                  )}
                >
                  {done ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                </span>
                <span className={clsx("min-w-0 flex-1", done && "text-muted-foreground")}>{step}</span>
                {done && <span className="shrink-0 type-caption text-subtle-foreground">{formatClock(at)}</span>}
              </button>
              {canMeasure && !done && (
                <Button variant="text" size="sm" className="mt-0.5 underline" onClick={() => startProcedure({ kind: indicator, taskId: state.openTask?.task.id })}>
                  {state.valueText ? "Re-measure" : "Measure"}
                </Button>
              )}
            </li>
          );
        })}
      </ol>
      {others.length > 0 && (
        <ul aria-label="Action log" className="mt-2 space-y-0.5 border-t border-border pt-2 type-caption">
          {others.map((a, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="shrink-0 text-subtle-foreground">{formatClock(a.t)}</span>
              <span className="min-w-0 text-muted-foreground">{actionText(a.kind, a.note)}</span>
            </li>
          ))}
        </ul>
      )}
      {alert && <p className="mt-2 max-w-[62ch] type-caption text-subtle-foreground">{alert.rule}</p>}
    </div>
  );
}
