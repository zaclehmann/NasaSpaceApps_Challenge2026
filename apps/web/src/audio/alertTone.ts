// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Alarm sounds, made with the Web Audio API (no file): two short falling tones, played twice.
// Two things ring it:
// - The routine alarm. While a check is due now it rings on every page, at the pace of the task that has
//   waited longest (see ringInterval): every 30 s for the first 2 min, every 15 s to 5 min, every 10 s to
//   10 min, then every 2.5 s. It stops for good once the astronaut presses Start or Postpone for that task
//   (state/attention.ts), and when the task is done or turns overdue. A ring already sounding is cut off.
// - A Warning. One ring when it first appears; it never repeats. Acknowledge cuts it off if still sounding.
// Alarms are never muted. The header Sound toggle (useAlertMute) is for click feedback, the click sound and
// vibration (audio/clickFeedback.ts); it is kept here, on this device, so both read one setting.
// Browsers keep audio locked until the page has had a click or key press. A routine ring asked for before
// then waits and plays once on the first interaction (a moment later, so a first press of Start or Postpone
// cancels it instead of ringing over it); a Warning that appeared before then is not rung late. So nothing
// ever sounds before the first interaction.
// Why rings never double up:
// - Tabs share the last ring time and the Warnings already rung in localStorage, and take a Web Lock
//   before ringing, so only one tab rings per beat.
// - All state lives in one object on globalThis, so a hot reload reuses it, and the old version's timer is
//   cleared when it is replaced.
// - A ring never starts while one is sounding.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { acted, isMarked, onAttentionChange } from "../state/attention";

/** The tone pattern lasts about 1.2 s. A new ring inside this window is dropped, never layered. */
const TONE_MS = 1300;
const LAST_RING_KEY = "missionvitals.alarm.lastRing";
const RUNG_KEY = "missionvitals.alarm.rung";
const MUTE_KEY = "missionvitals.alarm.muted";
const LOCK_NAME = "missionvitals-alarm";

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

interface AlarmState {
  version: 4;
  /** The output of the ring sounding now, so acting on it can cut it off. */
  out: GainNode | null;
  /** What the ring sounding now is for. */
  outKind: "routine" | "warning" | null;
  /** Stops listening to state/attention.ts; replaced on a hot reload. */
  unlisten?: () => void;
  ctx: AudioContext | null;
  /** A routine ring asked for while audio was still locked. Plays once on the first click or key press. */
  pending: boolean;
  unlockBound: boolean;
  /** Wall-clock time this tab last started the tone. */
  lastPlayed: number;
  /** What each mounted screen in this tab says is due now. Paused screens are not listed. */
  sources: Map<string, Source>;
  timer: ReturnType<typeof setTimeout> | undefined;
  /** A routine ring is being decided (waiting on the cross-tab lock). */
  ringing: boolean;
  /** Warnings this tab has already looked at. Each is considered once. */
  seen: Set<string>;
  muted: boolean;
  muteListeners: Set<(m: boolean) => void>;
}

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

const G = globalThis as unknown as { __missionvitalsAlarm?: AlarmState };
// A state object from an older version of this module lacks fields: stop its timer and start fresh.
if (G.__missionvitalsAlarm && G.__missionvitalsAlarm.version !== 4) {
  clearTimeout((G.__missionvitalsAlarm as Partial<AlarmState>).timer);
  G.__missionvitalsAlarm = undefined;
}
const S: AlarmState = (G.__missionvitalsAlarm ??= {
  version: 4,
  out: null,
  outKind: null,
  ctx: null,
  pending: false,
  unlockBound: false,
  lastPlayed: -Infinity,
  sources: new Map(),
  timer: undefined,
  ringing: false,
  seen: new Set(),
  muted: readMuted(),
  muteListeners: new Set(),
});

// When this module is replaced by a hot reload, stop its timer. The new version picks up the same state.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearTimeout(S.timer);
    S.timer = undefined;
  });
}

function context(): AudioContext | null {
  if (S.ctx) return S.ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  S.ctx = new AC();
  return S.ctx;
}

function tone(c: AudioContext, out: AudioNode, freq: number, start: number, length: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  // A short ramp in and out so the tone does not click.
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.18, start + 0.015);
  gain.gain.setValueAtTime(0.18, start + length - 0.03);
  gain.gain.linearRampToValueAtTime(0, start + length);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + length);
}

/**
 * Cuts off a ring that is sounding now (a fast fade, so it does not click). `kind` limits it to a routine
 * ring or a Warning ring. Silencing the routine alarm also drops a ring still waiting for the first press.
 */
function silence(kind: "routine" | "warning") {
  if (kind === "routine") S.pending = false;
  if (S.outKind === kind) cut();
}

function cut() {
  const out = S.out;
  S.out = null;
  S.outKind = null;
  if (!out || !S.ctx) return;
  const t = S.ctx.currentTime;
  out.gain.cancelScheduledValues(t);
  out.gain.setValueAtTime(out.gain.value, t);
  out.gain.linearRampToValueAtTime(0, t + 0.02);
  setTimeout(() => out.disconnect(), 100);
}

/**
 * Starts the tone now. Alarms ignore the mute. Rings never layer: a routine ring is dropped if this tab
 * started one less than TONE_MS ago or a Warning is sounding; a Warning takes over from a routine ring.
 */
function play(c: AudioContext, kind: "routine" | "warning") {
  const wall = Date.now();
  if (S.outKind === "warning") return;
  if (kind === "routine" && wall - S.lastPlayed < TONE_MS) return;
  cut();
  S.lastPlayed = wall;
  const t = c.currentTime + 0.02;
  const out = c.createGain();
  out.connect(c.destination);
  S.out = out;
  S.outKind = kind;
  for (let r = 0; r < 2; r++) {
    const o = t + r * 0.6;
    tone(c, out, 880, o, 0.16);
    tone(c, out, 660, o + 0.2, 0.22);
  }
  setTimeout(() => {
    if (S.out === out) {
      S.out = null;
      S.outKind = null;
    }
  }, TONE_MS);
}

/* ---------- shared across tabs ---------- */

function sharedLastRing(): number {
  try {
    const v = Number(window.localStorage.getItem(LAST_RING_KEY));
    return Number.isFinite(v) && v > 0 ? v : -Infinity;
  } catch {
    return S.lastPlayed;
  }
}

function setSharedLastRing(wall: number) {
  try {
    window.localStorage.setItem(LAST_RING_KEY, String(wall));
  } catch {
    // Storage blocked: this tab still never overlaps itself.
  }
}

/**
 * Runs `fn` while holding the cross-tab alarm lock. A routine ring skips it if the lock is busy (another
 * tab or ring has this beat); a Warning (`wait`) waits its turn, then checks the shared list itself.
 */
function withAlarmLock(fn: () => void, onDone?: () => void, wait = false) {
  const locks = (navigator as Navigator & { locks?: LockManager }).locks;
  if (!locks) {
    fn();
    onDone?.();
    return;
  }
  void locks
    .request(LOCK_NAME, { ifAvailable: !wait }, async (lock) => {
      if (lock) fn();
    })
    .finally(() => onDone?.());
}

function bindUnlock() {
  if (S.unlockBound) return;
  S.unlockBound = true;
  const unlock = () => {
    const c = context();
    if (!c) return;
    void c.resume().then(() => {
      if (!S.pending) return;
      // Wait for the press to land: if it was Start or Postpone for the due task, nothing is due any more.
      setTimeout(() => {
        if (!S.pending || longestWait(Date.now()) === null) {
          S.pending = false;
          return;
        }
        S.pending = false;
        // Same cross-tab rule: if another tab has just rung, this late ring is dropped.
        withAlarmLock(() => {
        const wall = Date.now();
        if (wall - sharedLastRing() < TONE_MS) return;
        setSharedLastRing(wall);
        play(c, "routine");
        });
      }, 400);
    });
  };
  window.addEventListener("pointerdown", unlock, { capture: true });
  window.addEventListener("keydown", unlock, { capture: true });
}

/* ---------- the routine alarm ---------- */

/**
 * Rings if no tab has rung within `gapMs`. The check and the write happen under one lock, so two tabs
 * can never both decide to ring. Audio still locked: remember it and ring on the first interaction.
 */
function ringIfDue(gapMs: number) {
  if (S.ringing) return;
  S.ringing = true;
  withAlarmLock(
    () => {
      const wall = Date.now();
      if (wall - sharedLastRing() < Math.max(TONE_MS, gapMs - 100)) return;
      const c = context();
      if (!c) return;
      bindUnlock();
      if (c.state === "running") {
        setSharedLastRing(wall);
        play(c, "routine");
      } else {
        // Do not claim the beat: a tab that can make sound should get it.
        S.pending = true;
      }
    },
    () => {
      S.ringing = false;
    },
  );
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

/** Seconds the longest-waiting due task has been waiting, or null if nothing is due. */
function longestWait(wall: number): number | null {
  let most: number | null = null;
  for (const s of S.sources.values()) {
    for (const i of s.items) {
      if (isMarked(acted(i.key))) continue;
      const waited = Math.max(0, s.met - i.dueAt + (wall - s.wall) / 1000);
      if (most === null || waited > most) most = waited;
    }
  }
  return most;
}

// Start or Postpone pressed: cut off the ring if it is for nothing that is still due, and look again.
S.unlisten?.();
S.unlisten = onAttentionChange(() => {
  if (longestWait(Date.now()) === null) silence("routine");
  tick();
});

function tick() {
  clearTimeout(S.timer);
  S.timer = undefined;
  const waited = longestWait(Date.now());
  if (waited === null) {
    // Nothing is due any more, so a tone still waiting for the first click is dropped.
    S.pending = false;
    return;
  }
  const gap = ringInterval(waited) * 1000;
  ringIfDue(gap);
  // Wake at the next beat of the shared rhythm, so every tab looks at the same moment and only one rings.
  const last = sharedLastRing();
  const next = Number.isFinite(last) ? last + gap : Date.now() + gap;
  S.timer = setTimeout(tick, Math.max(250, next - Date.now()));
}

/**
 * Tells the app-wide alarm which tasks this screen sees as due now. Any number of screens, tasks and tabs
 * can report; the alarm still rings once per beat. `paused` withdraws this screen's tasks, for example
 * while the measurement itself is open. `now` is the current MET in seconds.
 */
export function useDueAlarm(items: DueItem[], now: number, paused: boolean) {
  const id = useId();
  const latest = useRef({ items, now });
  latest.current = { items, now };
  const signature = items.map((i) => i.key).join("|");

  useEffect(() => {
    bindUnlock();
    if (paused || latest.current.items.length === 0) {
      S.sources.delete(id);
    } else {
      S.sources.set(id, { items: latest.current.items, met: latest.current.now, wall: Date.now() });
    }
    tick();
    return () => {
      S.sources.delete(id);
      // Check again after React has had the chance to re-register (a changed task list, a page change,
      // or the development double mount), so a ring waiting for the first click is not dropped early.
      clearTimeout(S.timer);
      S.timer = setTimeout(tick, 0);
    };
  }, [id, signature, paused]);
}

/* ---------- Warnings ---------- */

function readRung(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(RUNG_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeRung(keys: string[]) {
  try {
    window.localStorage.setItem(RUNG_KEY, JSON.stringify(keys.slice(-50)));
  } catch {
    // Storage blocked: this tab still rings each Warning only once (S.seen).
  }
}

/** Rings once for a Warning no tab has rung yet. Silent only while audio is still locked. */
function ringWarning(key: string) {
  const c = context();
  bindUnlock();
  if (!c || c.state !== "running") return;
  withAlarmLock(() => {
    const rung = readRung();
    if (rung.includes(key)) return;
    writeRung([...rung, key]);
    setSharedLastRing(Date.now());
    play(c, "warning");
  }, undefined, true);
}

/** Rings once for each unacknowledged Warning when it first appears. `keys` are the alert ids. */
export function useWarningTone(keys: string[]) {
  const signature = keys.join("|");
  const before = useRef<string[]>([]);
  useEffect(() => {
    // A Warning that has left the list was acknowledged: stop its ring if it is still sounding.
    if (before.current.some((k) => !keys.includes(k))) silence("warning");
    before.current = keys;
    for (const key of keys) {
      if (S.seen.has(key)) continue;
      S.seen.add(key);
      ringWarning(key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
}

/* ---------- mute ---------- */

/**
 * The mute for click feedback (click sound and vibration), and a setter. It never mutes an alarm.
 * Shared by every screen; kept on this device under MUTE_KEY, which clickFeedback.ts reads.
 */
export function useAlertMute(): [boolean, (m: boolean) => void] {
  const [muted, setMutedState] = useState(S.muted);
  useEffect(() => {
    S.muteListeners.add(setMutedState);
    return () => {
      S.muteListeners.delete(setMutedState);
    };
  }, []);
  const set = useCallback((m: boolean) => {
    S.muted = m;
    try {
      window.localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {
      // The choice lasts for this visit only.
    }
    S.muteListeners.forEach((l) => l(m));
  }, []);
  return [muted, set];
}
