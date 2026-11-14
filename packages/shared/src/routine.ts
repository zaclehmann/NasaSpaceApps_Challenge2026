// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The demo daily routine (ui.md 5.7) and how each task's state is worked out.
import type { IndicatorKey, RoutineEntry, RoutineTask, TaskState } from "./types";
import { startOfDay } from "./time";

/** A task is "Due now" for this long after its time, then "Overdue" (shown as Watch). */
export const DUE_WINDOW_MIN = 60;

export const ROUTINE: RoutineTask[] = [
  { id: "bp-am", minute: 7 * 60, label: "Blood pressure", kind: "bp", procedureId: "HM-3" },
  { id: "temp-am", minute: 7 * 60 + 5, label: "Temperature", kind: "temp", procedureId: "HM-5" },
  { id: "glucose-am", minute: 7 * 60 + 10, label: "Blood glucose (fasting)", kind: "glucose", procedureId: "HM-4" },
  { id: "sleep-review", minute: 7 * 60 + 15, label: "Sleep review", kind: "sleep", procedureId: "HM-6" },
  { id: "mood", minute: 14 * 60 + 30, label: "Mood check-in", kind: "mood", procedureId: "HM-7" },
  { id: "exercise", minute: 16 * 60, label: "Confirm today's exercise", kind: "exercise", procedureId: "HM-9" },
  { id: "bp-pm", minute: 21 * 60, label: "Evening blood pressure", kind: "bp", procedureId: "HM-3" },
];

export function taskDueAt(task: RoutineTask, now: number): number {
  return startOfDay(now) + task.minute * 60;
}

/** How far "Postpone" pushes a due task back. */
export const POSTPONE_MIN = 30;

export function taskState(task: RoutineTask, completedAt: number | undefined, now: number, due = taskDueAt(task, now)): TaskState {
  const day = startOfDay(now);
  if (completedAt !== undefined && completedAt >= day) return { kind: "done", at: completedAt };
  if (now < due) return { kind: "upcoming" };
  const late = (now - due) / 60;
  if (late < DUE_WINDOW_MIN) return { kind: "due" };
  return { kind: "overdue", minutes: Math.floor(late) };
}

/** `postponed` maps a task id to its new due time. Only a postponement made today counts. */
export function routineEntries(tasks: RoutineTask[], completions: Record<string, number>, now: number, postponed: Record<string, number> = {}): RoutineEntry[] {
  const day = startOfDay(now);
  return tasks.map((task) => {
    const moved = postponed[task.id];
    const isPostponed = moved !== undefined && moved >= day;
    const dueAt = isPostponed ? moved : taskDueAt(task, now);
    return { task, state: taskState(task, completions[task.id], now, dueAt), dueAt, postponed: isPostponed };
  });
}

/** The next task to do: overdue first, then due, then the upcoming one due soonest. */
export function nextTask(entries: RoutineEntry[]): RoutineEntry | undefined {
  const upcoming = entries.filter((e) => e.state.kind === "upcoming").sort((a, b) => a.dueAt - b.dueAt);
  return entries.find((e) => e.state.kind === "overdue") ?? entries.find((e) => e.state.kind === "due") ?? upcoming[0];
}

/** Where today's routine stands for one indicator, for the status function. */
export function routineContext(entries: RoutineEntry[], key: IndicatorKey): "none" | "upcoming" | "due" | "overdue" {
  const mine = entries.filter((e) => e.task.kind === key);
  if (mine.some((e) => e.state.kind === "overdue")) return "overdue";
  if (mine.some((e) => e.state.kind === "due")) return "due";
  if (mine.some((e) => e.state.kind === "upcoming")) return "upcoming";
  return "none";
}
