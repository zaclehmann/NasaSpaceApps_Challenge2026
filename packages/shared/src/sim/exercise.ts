// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The shirt's running exercise total for today, before the astronaut confirms it.
import { startOfDay } from "../time";
import { BASE, SESSION_START } from "./crew";

/**
 * Minutes of exercise so far today at MET `now`: a morning resistance session of 60 minutes and an afternoon
 * aerobic session for the rest of the usual daily total, at each astronaut's own times, so the totals differ.
 */
export function exerciseSoFar(astronautId: string, now: number): number {
  const b = BASE[astronautId];
  if (!b) return 0;
  const day = startOfDay(now);
  const [am, pm] = SESSION_START[astronautId] ?? [9 * 60, 13 * 60 + 30];
  const sessions: [number, number][] = [
    [am, 60],
    [pm, b.exercise - 60],
  ];
  const minute = (now - day) / 60;
  return Math.round(sessions.reduce((sum, [start, len]) => sum + Math.max(0, Math.min(len, minute - start)), 0));
}
