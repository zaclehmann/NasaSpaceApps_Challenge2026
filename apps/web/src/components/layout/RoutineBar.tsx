// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Routine bar (ui.md 5.2, 5.7): a duty roster, not a game. Segments, count, streak, next task, Start.
import * as Popover from "@radix-ui/react-popover";
import clsx from "clsx";
import { formatClock, nextTask, taskDueAt, type RoutineEntry } from "@missionvitals/shared";
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

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function Segments({ entries }: { entries: RoutineEntry[] }) {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {entries.map((e) =>
        e.state.kind === "overdue" ? (
          <BadgeIcon key={e.task.id} status="watch" />
        ) : (
          <span
            key={e.task.id}
            className={clsx("h-5 w-2.5 border transition-colors duration-200", e.state.kind === "done" ? "border-foreground bg-foreground" : "border-border-strong")}
          />
        ),
      )}
    </span>
  );
}

export function RoutineBar({ view, variant = "bar" }: { view: HealthView; variant?: "bar" | "inline" }) {
  const { startProcedure } = useUi();
  const { routine, now } = view;
  const next = nextTask(routine.entries);
  const canStart = next && (next.state.kind === "due" || next.state.kind === "overdue");
  const nextText = next ? `Next: ${lower(next.task.label)}, ${lower(taskStatusText(next, now))}` : "All of today's checks are done";
  const bar = variant === "bar";
  return (
    <section aria-label="Today's routine" className={clsx("flex items-center gap-x-4 gap-y-2", bar ? "h-14 border-b border-border px-4" : "flex-wrap py-3")}>
      <Popover.Root>
        <Popover.Trigger className="-ml-2 flex min-h-12 min-w-0 items-center gap-x-4 gap-y-1 rounded-md px-2 text-left hover:bg-muted max-md:flex-wrap">
          <span className="type-small font-semibold">Today's routine</span>
          <Segments entries={routine.entries} />
          <span className="type-small whitespace-nowrap">
            {routine.done} of {routine.total} done
          </span>
          <span className={clsx("type-small whitespace-nowrap text-muted-foreground", bar && "max-lg:hidden")}>Streak {routine.streakDays} days</span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="start" sideOffset={6} className="z-50 w-[min(420px,calc(100vw-32px))] rounded-lg bg-card p-4 text-foreground shadow-float outline-none">
            <h2 className="type-section">Today's routine</h2>
            <ul className="mt-2 divide-y divide-border">
              {routine.entries.map((e) => {
                const open = e.state.kind === "due" || e.state.kind === "overdue";
                return (
                  <li key={e.task.id} className="flex min-h-12 items-center gap-3 py-2 type-small">
                    <span className="w-11 shrink-0 text-muted-foreground">{formatClock(e.task.minute * 60)}</span>
                    <span className="min-w-0 flex-1">{e.task.label}</span>
                    <span className={clsx("flex items-center gap-1.5 whitespace-nowrap", e.state.kind === "overdue" ? "text-watch-text" : "text-muted-foreground")}>
                      {e.state.kind === "overdue" && <BadgeIcon status="watch" />}
                      {taskStatusText(e, now)}
                    </span>
                    {open && (
                      <Popover.Close asChild>
                        <Button size="sm" onClick={() => startProcedure({ kind: e.task.kind, taskId: e.task.id })}>
                          Start
                        </Button>
                      </Popover.Close>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 type-caption text-subtle-foreground">
              This week: {routine.weekDone} of {routine.weekTotal} tasks. Streak {routine.streakDays} days.
            </p>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <span className={clsx("min-w-0 type-small text-muted-foreground", bar ? "ml-auto overflow-hidden text-ellipsis whitespace-nowrap" : "basis-full")}>{nextText}</span>
      {canStart && next && (
        <Button variant="primary" size={bar ? "sm" : "md"} className={bar ? "" : "w-full"} onClick={() => startProcedure({ kind: next.task.kind, taskId: next.task.id })}>
          Start
        </Button>
      )}
    </section>
  );
}
