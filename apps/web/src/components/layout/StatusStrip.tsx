// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// One strip under the header that answers "Am I OK?" (ui.md 4.2) and names the next routine check.
// An unacknowledged Warning turns the strip into the Warning bar (ui.md 5.6): tint, red rule, View.
// Nothing is said twice. A check that is due now shows a red Postpone and a green Start that pulses.
// The alarm that goes with it is rung from the app shell (RoutineAlarm), so it sounds on every page.
// "Routine" opens today's full routine as a page. On phone the strip keeps only Start; Routine and
// Symptoms move to the More tab.
import clsx from "clsx";
import { ListChecks, Stethoscope } from "lucide-react";
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { nextTask } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useUi, type Selection } from "../../state/ui";
import { buildSummary } from "../panel/summary";
import { BadgeIcon } from "../status/StatusBadge";
import { Button } from "../ui/Button";
import { TaskActions, taskStatusText } from "./RoutineList";

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function StatusStrip({ view, routine }: { view: HealthView; routine: boolean }) {
  const { select, setRoutineOpen, setSymptomsOpen } = useUi();
  const navigate = useNavigate();
  const s = buildSummary(view);
  const warning = view.alerts.find((a) => a.status === "warning" && !a.acknowledged);
  const next = nextTask(view.routine.entries);
  const canStart = next && (next.state.kind === "due" || next.state.kind === "overdue");
  const open = (target: Selection) => {
    navigate("/");
    select(target);
  };
  const link = "relative underline decoration-border-strong underline-offset-4 hover:decoration-foreground max-xl:before:absolute max-xl:before:inset-x-0 max-xl:before:-inset-y-3 max-xl:before:content-['']";
  const names = (items: typeof s.names) =>
    items.map((i, n) => (
      <Fragment key={i.id}>
        {n > 0 && (n === items.length - 1 ? " and " : ", ")}
        <button type="button" className={link} onClick={() => open(i.target)}>
          {i.phrase}
        </button>
      </Fragment>
    ));
  return (
    <div
      role={warning ? "alert" : "status"}
      aria-live={warning ? "assertive" : "polite"}
      className={clsx("flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2 md:min-h-12", warning ? "border-warning bg-warning-tint" : "border-border")}
    >
      <p className="flex min-w-0 flex-1 basis-64 items-start gap-2.5 text-[17px] leading-6 font-medium">
        <BadgeIcon status={s.status} size={18} className="mt-[3px]" />
        <span className="min-w-0">
          {s.lead}
          {names(s.names)}
          {s.tail}
          {s.watching.length > 0 && <span className="font-normal text-muted-foreground"> Also watching: {names(s.watching)}.</span>}
        </span>
      </p>
      {warning && (
        <Button size="sm" onClick={() => open({ kind: "indicator", key: warning.indicator })}>
          View
        </Button>
      )}
      {routine && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="type-small text-muted-foreground">{next ? `Next check: ${lower(next.task.label)}, ${lower(taskStatusText(next, view.now))}` : "Today's checks are done"}</span>
          {canStart && next && <TaskActions e={next} startOnlyOnPhone />}
          <span aria-hidden="true" className="h-5 w-px bg-border max-md:hidden" />
          <Button size="sm" variant="secondary" className="max-md:hidden" onClick={() => setRoutineOpen(true)}>
            <ListChecks size={16} strokeWidth={1.5} aria-hidden="true" />
            Routine
          </Button>
          <Button size="sm" variant="secondary" className="max-md:hidden" onClick={() => setSymptomsOpen(true)}>
            <Stethoscope size={16} strokeWidth={1.5} aria-hidden="true" />
            Symptoms
          </Button>
        </div>
      )}
    </div>
  );
}
