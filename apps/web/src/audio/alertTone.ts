// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The routine alarm: two short falling tones, played twice, made with the Web Audio API (no file).
// There is one alarm for the whole app. Every screen reports the tasks that are due now; however many
// tasks or crew members are due, it rings once per beat, at the pace of the task that has waited
// longest (see ringInterval), and a ring never starts while the last one is still sounding.
// Browsers keep audio locked until the page has had a click or key press. A tone asked for before then
// waits and plays once on the first interaction.
import { useEffect, useId, useRef } from "react";

/** The tone pattern lasts about 1.2 s. A new ring inside this window is dropped, never layered. */
const TONE_MS = 1300;

let ctx: AudioContext | null = null;
let pending = false;
let unlockBound = false;
let lastPlayed = -Infinity;

function context(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

function tone(c: AudioContext, freq: number, start: number, length: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  // A short ramp in and out so the tone does not click.
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.18, start + 0.015);
  gain.gain.setValueAtTime(0.18, start + length - 0.03);
  gain.gain.linearRampToValueAtTime(0, start + length);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + length);
}

function play(c: AudioContext) {
  const wall = Date.now();
  if (wall - lastPlayed < TONE_MS) return;
  lastPlayed = wall;
  const t = c.currentTime + 0.02;
  for (let r = 0; r < 2; r++) {
    const o = t + r * 0.6;
    tone(c, 880, o, 0.16);
    tone(c, 660, o + 0.2, 0.22);
  }
}

function bindUnlock() {
  if (unlockBound) return;
  unlockBound = true;
  const unlock = () => {
    const c = context();
    if (!c) return;
    void c.resume().then(() => {
      if (pending) {
        pending = false;
        play(c);
      }
    });
  };
  window.addEventListener("pointerdown", unlock, { capture: true });
  window.addEventListener("keydown", unlock, { capture: true });
}

export function playAlertTone() {
  const c = context();
  if (!c) return;
  bindUnlock();
  if (c.state === "running") play(c);
  else pending = true;
}

/**
 * Seconds between rings, by how long the task has been due:
 * every 30 s for the first 2 min, every 15 s to 5 min, every 10 s to 10 min, then every 2.5 s.
 */
export function ringInterval(dueForSec: number): number {
  if (dueForSec < 120) return 30;
  if (dueForSec < 300) return 15;
  if (dueForSec < 600) return 10;
  return 2.5;
}

/* ---------- the single alarm ---------- */

export interface DueItem {
  /** Stable for one due task, e.g. astronaut, task id and due time. */
  key: string;
  /** MET seconds when the task fell due. */
  dueAt: number;
}

interface Source {
  items: DueItem[];
  /** MET and wall clock at registration; MET runs at wall-clock speed. */
  met: number;
  wall: number;
}

/** What each mounted screen says is due now. Paused screens are not listed. */
const sources = new Map<string, Source>();
/** Wall-clock time of the last ring, shared by every task, so the alarm never doubles up. */
let lastRing: number | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Seconds the longest-waiting due task has been waiting, or null if nothing is due. */
function longestWait(wall: number): number | null {
  let most: number | null = null;
  for (const s of sources.values()) {
    for (const i of s.items) {
      const waited = Math.max(0, s.met - i.dueAt + (wall - s.wall) / 1000);
      if (most === null || waited > most) most = waited;
    }
  }
  return most;
}

function tick() {
  clearTimeout(timer);
  timer = undefined;
  const wall = Date.now();
  const waited = longestWait(wall);
  if (waited === null) {
    // Nothing is due any more, so a tone still waiting for the first click is dropped.
    pending = false;
    return;
  }
  const gap = ringInterval(waited) * 1000;
  // Ring if it has not rung yet, or this stage's gap has passed (a little slack for timers).
  if (lastRing === undefined || wall - lastRing >= gap - 100) {
    playAlertTone();
    lastRing = wall;
  }
  const next = lastRing + ringInterval(longestWait(Date.now()) ?? waited) * 1000;
  timer = setTimeout(tick, Math.max(250, next - Date.now()));
}

/**
 * Tells the app-wide alarm which tasks this screen sees as due now. Any number of screens and tasks
 * can report; the alarm still rings once per beat. `paused` withdraws this screen's tasks, for
 * example while the measurement itself is open. `now` is the current MET in seconds.
 */
export function useDueAlarm(items: DueItem[], now: number, paused: boolean) {
  const id = useId();
  const latest = useRef({ items, now });
  latest.current = { items, now };
  const signature = items.map((i) => i.key).join("|");

  useEffect(() => {
    if (paused || latest.current.items.length === 0) {
      sources.delete(id);
    } else {
      sources.set(id, { items: latest.current.items, met: latest.current.now, wall: Date.now() });
    }
    tick();
    return () => {
      sources.delete(id);
      // Check again after React has had the chance to re-register (a changed task list, a page change,
      // or the development double mount), so a ring waiting for the first click is not dropped early.
      clearTimeout(timer);
      timer = setTimeout(tick, 0);
    };
  }, [id, signature, paused]);
}
