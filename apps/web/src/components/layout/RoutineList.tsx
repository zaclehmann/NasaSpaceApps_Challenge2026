// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Today's routine (ui.md 5.7): a duty roster, not a game. Every task is listed with its time and state.
// It opens as a full page from the "Routine" button in the status strip: below the header on tablet and
// desktop, full screen on phone, with a Back button. Built on Radix Dialog: focus is trapped, Escape and
// Back close it, focus returns to the button.
import * as RD from "@radix-ui/react-dialog";
import clsx from "clsx";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { POSTPONE_MIN, formatClock, type RoutineEntry } from "@missionvitals/shared";
import { useData } from "../../data/DataProvider";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { BadgeIcon } from "../status/StatusBadge";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { useReturnFocus } from "../ui/useReturnFocus";

// `now` is kept so callers stay unchanged; the due time already lives on the entry.
export function taskStatusText(e: RoutineEntry, _now?: number): string {
  switch (e.state.kind) {
    case "done":
      return `Done ${formatClock(e.state.at)}`;
    case "due":
      return "Due now";
    case "overdue":
      return `Overdue ${e.state.minutes} min`;
    case "upcoming":
      return e.postponed ? `Postponed to ${formatClock(e.dueAt)}` : `Due ${formatClock(e.dueAt)}`;
  }
}

/**
 * The actions for an open task, the same in the status strip and the routine table.
 * Start is the primary (black) button. Due now also offers Postpone as a secondary button.
 * No status-coloured fills and no pulsing: status colour is only for status (ui.md 3.3).
 */
export function TaskActions({ e }: { e: RoutineEntry }) {
  const { startProcedure, setPostponeTaskId } = useUi();
  const due = e.state.kind === "due";
  return (
    <span className="inline-flex items-center gap-2">
      {due && (
        <Button size="sm" variant="secondary" onClick={() => setPostponeTaskId(e.task.id)}>
          Postpone
        </Button>
      )}
      <Button size="sm" variant="primary" onClick={() => startProcedure({ kind: e.task.kind, taskId: e.task.id })}>
        Start
      </Button>
    </span>
  );
}

/** The Status cell: one word or phrase, with an icon only where it adds meaning. */
function StatusCell({ e }: { e: RoutineEntry }) {
  switch (e.state.kind) {
    case "done":
      return (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Check size={14} strokeWidth={2} aria-hidden="true" />
          Done
        </span>
      );
    case "due":
      return (
        <span className="flex items-center gap-2 font-medium text-foreground">
          <span aria-hidden="true" className="size-2 rounded-full bg-warning" />
          Due now
        </span>
      );
    case "overdue":
      return (
        <span className="flex items-center gap-1.5 text-watch-text">
          <BadgeIcon status="watch" size={14} />
          Overdue {e.state.minutes} min
        </span>
      );
    case "upcoming":
      return <span className="text-muted-foreground">{e.postponed ? `Postponed to ${formatClock(e.dueAt)}` : "Upcoming"}</span>;
  }
}

const cell = "px-3 py-2 whitespace-nowrap";
const mono = "font-mono text-[13px] tabular-nums";
const empty = <span className="text-subtle-foreground">-</span>;

function TaskRow({ e }: { e: RoutineEntry }) {
  const open = e.state.kind === "due" || e.state.kind === "overdue";
  const done = e.state.kind === "done";
  return (
    <tr className={clsx("h-12 align-middle", e.state.kind === "due" && "bg-muted/60")}>
      <td className={clsx(cell, mono, "text-muted-foreground")}>{formatClock(e.task.minute * 60)}</td>
      <th scope="row" className={clsx(cell, "text-left", done ? "font-normal text-muted-foreground" : "font-medium")}>
        {e.task.label}
      </th>
      <td className={clsx(cell, mono, "text-muted-foreground")}>{e.task.procedureId}</td>
      <td className={cell}>
        <StatusCell e={e} />
      </td>
      <td className={clsx(cell, mono, "text-muted-foreground")}>{e.state.kind === "done" ? formatClock(e.state.at) : empty}</td>
      <td className={clsx(cell, "text-right")}>
        {open ? <TaskActions e={e} /> : empty}
      </td>
    </tr>
  );
}

const COLUMNS = ["Time", "Task", "Procedure", "Status", "Completed", "Actions"];

export function RoutineList({ view }: { view: HealthView }) {
  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 pt-6 pb-10 md:px-6">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full type-small">
          <caption className="sr-only">Today's routine tasks, with status and actions</caption>
          <thead className="bg-muted type-label text-muted-foreground">
            <tr>
              {COLUMNS.map((h) => (
                <th key={h} scope="col" className={clsx("px-3 py-2.5 font-medium whitespace-nowrap", h === "Actions" ? "text-right" : "text-left")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {view.routine.entries.map((e) => (
              <TaskRow key={e.task.id} e={e} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 type-caption text-subtle-foreground">Times are MET. Postpone moves a due task later today; it comes back as due at the new time.</p>
    </div>
  );
}

export function RoutinePage({ view }: { view: HealthView }) {
  const { routineOpen, setRoutineOpen } = useUi();
  const returnFocus = useReturnFocus(routineOpen);
  return (
    <RD.Root open={routineOpen} onOpenChange={setRoutineOpen}>
      <RD.Portal>
        <RD.Content
          onCloseAutoFocus={returnFocus}
          onOpenAutoFocus={(e) => {
            // Focus the page itself, so the Back button does not open with a focus ring.
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }}
          className="anim-page fixed inset-0 z-40 flex flex-col bg-background text-foreground outline-none md:top-12"
        >
          <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-2 md:px-4">
            <RD.Close className="flex h-10 items-center gap-2 rounded-md px-2 type-small font-medium hover:bg-muted max-xl:h-12">
              <ArrowLeft size={18} strokeWidth={1.5} aria-hidden="true" />
              Back
            </RD.Close>
            <span aria-hidden="true" className="h-5 w-px bg-border" />
            <RD.Title className="type-section">Today's routine</RD.Title>
            <RD.Description className="ml-auto type-small text-muted-foreground max-sm:hidden">{view.astronaut.name}</RD.Description>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <RoutineList view={view} />
          </div>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

const POSTPONE_OPTIONS = [5, 10, 15, 30, 60, 120];
const optionLabel = (m: number) => (m < 60 ? `${m} minutes` : m === 60 ? "1 hour" : `${m / 60} hours`);

/** Choose how long to postpone a due task. Opened by any Postpone button. */
export function PostponeDialog({ view }: { view: HealthView }) {
  const { postponeTaskId, setPostponeTaskId } = useUi();
  const { source } = useData();
  const [minutes, setMinutes] = useState(POSTPONE_MIN);
  const id = useId();
  const entry = view.routine.entries.find((e) => e.task.id === postponeTaskId);
  const open = !!entry && entry.state.kind === "due";
  const close = () => {
    setPostponeTaskId(null);
    setMinutes(POSTPONE_MIN);
  };
  const confirm = () => {
    if (entry) source.postponeTask(view.astronaut.id, entry.task.id, minutes);
    close();
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && close()}
      title={entry ? `Postpone ${entry.task.label.toLowerCase()}` : "Postpone"}
      subtitle={entry ? `Due now, procedure ${entry.task.procedureId}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirm}>
            Postpone
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="type-label text-muted-foreground">
          Postpone by
        </label>
        <div className="relative">
          <select
            id={id}
            value={minutes}
            onChange={(ev) => setMinutes(Number(ev.target.value))}
            className="h-12 w-full appearance-none rounded-md border border-input bg-card pr-10 pl-3 type-body text-foreground xl:h-10"
          >
            {POSTPONE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {optionLabel(m)}
              </option>
            ))}
          </select>
          <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
        </div>
        <p className="pt-1 type-small text-muted-foreground">
          New due time <span className="font-mono text-[13px] text-foreground tabular-nums">{formatClock(view.now + minutes * 60)}</span> MET. The alarm stops until then.
        </p>
      </div>
    </Dialog>
  );
}
