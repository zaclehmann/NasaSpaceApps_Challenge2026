// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Today's routine (ui.md 5.7): a duty roster, not a game. Every task is listed with its time and state.
import clsx from "clsx";
import { formatClock, taskDueAt, type RoutineEntry } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { BadgeIcon } from "../status/StatusBadge";
import { Button } from "../ui/Button";

export function taskStatusText(e: RoutineEntry, now: number): string {
  switch (e.state.kind) {
    case "done":
      return `Done ${formatClock(e.state.at)}`;
    case "due":
      return "Due now";
    case "overdue":
      return `Overdue ${e.state.minutes} min`;
    case "upcoming":
      return `Due ${formatClock(taskDueAt(e.task, now))}`;
  }
}

export function RoutineList({ view }: { view: HealthView }) {
  const { startProcedure } = useUi();
  const { routine, now } = view;
  return (
    <section aria-label="Today's routine" className="pb-3">
      <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-1">
        <h2 className="type-label text-muted-foreground">Today's routine</h2>
        <span className="type-caption text-subtle-foreground">
          {routine.done} of {routine.total} done, streak {routine.streakDays} days
        </span>
      </div>
      <ul>
        {routine.entries.map((e) => {
          const open = e.state.kind === "due" || e.state.kind === "overdue";
          const done = e.state.kind === "done";
          return (
            <li key={e.task.id} className="flex min-h-9 items-center gap-3 px-4 type-small max-xl:min-h-12">
              <span className="w-10 shrink-0 text-subtle-foreground">{formatClock(e.task.minute * 60)}</span>
              <span className={clsx("min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap", done ? "text-muted-foreground" : open && "font-medium")}>{e.task.label}</span>
              {open ? (
                <>
                  <span className={clsx("flex shrink-0 items-center gap-1 type-caption", e.state.kind === "overdue" ? "text-watch-text" : "text-foreground")}>
                    {e.state.kind === "overdue" && <BadgeIcon status="watch" size={12} />}
                    {taskStatusText(e, now)}
                  </span>
                  <Button variant="text" size="sm" className="underline" onClick={() => startProcedure({ kind: e.task.kind, taskId: e.task.id })}>
                    Start
                  </Button>
                </>
              ) : (
                <span className="shrink-0 type-caption text-subtle-foreground">{taskStatusText(e, now)}</span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="px-4 pt-1 type-caption text-subtle-foreground">
        This week: {routine.weekDone} of {routine.weekTotal} tasks.
      </p>
    </section>
  );
}
