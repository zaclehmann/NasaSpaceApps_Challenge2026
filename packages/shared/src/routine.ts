// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The demo daily routine (ui.md 5.7) and how each task's state is worked out.
import type { RoutineEntry, RoutineTask, TaskState } from "./types";
import { startOfDay } from "./time";

/** A task is "Due now" for this long after its time, then "Overdue". */
export const DUE_WINDOW_MIN = 30;

export const ROUTINE: RoutineTask[] = [
  { id: "bp-am", minute: 7 * 60, label: "Blood pressure", kind: "bp", procedureId: "HM-3" },
  { id: "glucose-am", minute: 7 * 60 + 10, label: "Blood glucose (fasting)", kind: "glucose", procedureId: "HM-4" },
  { id: "sleep-review", minute: 7 * 60 + 15, label: "Sleep review", kind: "sleep", procedureId: "HM-6" },
  { id: "mood", minute: 14 * 60 + 30, label: "Mood check-in", kind: "mood", procedureId: "HM-7" },
  { id: "exercise", minute: 16 * 60, label: "Exercise log", kind: "exercise", procedureId: "HM-9" },
  { id: "bp-pm", minute: 21 * 60, label: "Evening blood pressure", kind: "bp", procedureId: "HM-3" },
];

export function taskDueAt(task: RoutineTask, now: number): number {
  return startOfDay(now) + task.minute * 60;
}

export function taskState(task: RoutineTask, completedAt: number | undefined, now: number): TaskState {
  const day = startOfDay(now);
  if (completedAt !== undefined && completedAt >= day) return { kind: "done", at: completedAt };
  const due = taskDueAt(task, now);
  if (now < due) return { kind: "upcoming" };
  const late = (now - due) / 60;
  if (late < DUE_WINDOW_MIN) return { kind: "due" };
  return { kind: "overdue", minutes: Math.floor(late) };
}

export function routineEntries(tasks: RoutineTask[], completions: Record<string, number>, now: number): RoutineEntry[] {
  return tasks.map((task) => ({ task, state: taskState(task, completions[task.id], now) }));
}

/** The next task to do: overdue first, then due, then the earliest upcoming. */
export function nextTask(entries: RoutineEntry[]): RoutineEntry | undefined {
  return (
    entries.find((e) => e.state.kind === "overdue") ??
    entries.find((e) => e.state.kind === "due") ??
    entries.find((e) => e.state.kind === "upcoming")
  );
}
