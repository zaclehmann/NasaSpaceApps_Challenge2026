// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// What the user has already responded to, so attention cues stop (WCAG 2.2.2, Pause, Stop, Hide).
// - A pulse (green Start, a crew picker row) runs 5 cycles, then stops for good for that item.
// - Acting on the item stops it at once: Start or Postpone for a due check, opening a crew picker row.
// - Acting on a due check also silences its routine alarm (audio/alertTone.ts reads this store).
// A newly due check has a new key (it includes the due time), so it pulses and rings again.
// Kept in memory for this visit; choosing another demo scenario clears it.
import { useSyncExternalStore } from "react";

interface AttentionState {
  done: Set<string>;
  listeners: Set<() => void>;
  version: number;
}

const G = globalThis as unknown as { __missionvitalsAttention?: AttentionState };
const S: AttentionState = (G.__missionvitalsAttention ??= { done: new Set(), listeners: new Set(), version: 0 });

function emit() {
  S.version++;
  S.listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  S.listeners.add(l);
  return () => {
    S.listeners.delete(l);
  };
}

/** Key for one due check: astronaut, task and due time. The routine alarm uses the same key. */
export function dueKey(astronautId: string, taskId: string, dueAt: number): string {
  return `${astronautId}:${taskId}:${dueAt}`;
}

/** The user started or postponed this due check. */
export const acted = (key: string) => `act:${key}`;
/** This pulse has run its cycles. */
export const pulsed = (where: string, key: string) => `pulse:${where}:${key}`;
/** The user opened this crew picker row. */
export const opened = (key: string) => `open:${key}`;

export function mark(...keys: string[]) {
  let changed = false;
  for (const k of keys) {
    if (S.done.has(k)) continue;
    S.done.add(k);
    changed = true;
  }
  if (changed) emit();
}

export function isMarked(key: string): boolean {
  return S.done.has(key);
}

/** Forget everything, for a new demo scenario. */
export function resetAttention() {
  if (S.done.size === 0) return;
  S.done.clear();
  emit();
}

/** Re-renders when anything is marked. */
export function useAttentionVersion(): number {
  return useSyncExternalStore(subscribe, () => S.version);
}

/** The listener for alertTone.ts, outside React. */
export function onAttentionChange(l: () => void): () => void {
  return subscribe(l);
}

/**
 * A pulse for one item: whether it should run now, and the handler that records it has finished.
 * Off when `key` is null (nothing due), when any of `stopKeys` is marked, or once it has run its cycles.
 */
export function usePulse(where: string, key: string | null, stopKeys: string[] = []) {
  useAttentionVersion();
  const done = key === null || isMarked(pulsed(where, key)) || stopKeys.some(isMarked);
  return {
    pulse: !done,
    /** Pass to onAnimationEnd: the CSS animation runs 5 cycles, then this records it. */
    onAnimationEnd: (e: { target: EventTarget; currentTarget: EventTarget }) => {
      if (key !== null && e.target === e.currentTarget) mark(pulsed(where, key));
    },
  };
}
