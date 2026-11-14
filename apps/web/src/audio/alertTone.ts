// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The Warning tone: two short falling tones, played twice, made with the Web Audio API (no file).
// Policy:
// - Warning only. Due checks, Watch and Caution are silent.
// - Never loops. Each Warning rings once, when it first appears; it never repeats, even while unacknowledged.
// - Off until the user has interacted. Before the first click or key press nothing plays, and nothing is
//   saved up to play later.
// - Visible mute (SoundToggle in the header). The choice is kept on this device.
// Playback rules that stop rings doubling up:
// - Tabs share the list of Warnings already rung in localStorage and take a Web Lock before ringing, so one
//   Warning rings once across every open tab.
// - All state lives in one object on globalThis, so a hot reload while developing reuses it rather than
//   leaving an old AudioContext beside a new one.
// - A ring never starts while one is sounding.
import { useCallback, useEffect, useState } from "react";

/** The tone pattern lasts about 1.2 s. A new ring inside this window is dropped, never layered. */
const TONE_MS = 1300;
/** Warnings already rung, shared by every tab of the app on this device. */
const RUNG_KEY = "missionvitals.alarm.rung";
const MUTE_KEY = "missionvitals.alarm.muted";
const LOCK_NAME = "missionvitals-alarm";

interface AlarmState {
  ctx: AudioContext | null;
  /** The page has had a click or key press, so the browser allows sound. */
  interacted: boolean;
  unlockBound: boolean;
  /** Wall-clock time this tab last started the tone. */
  lastPlayed: number;
  /** Warnings this tab has already looked at. Each is considered once, so nothing repeats or plays late. */
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
// A state object from an older version of this module (the due-check alarm) lacks these fields: start fresh.
const S: AlarmState = G.__missionvitalsAlarm && "seen" in G.__missionvitalsAlarm
  ? G.__missionvitalsAlarm
  : (G.__missionvitalsAlarm = { ctx: null, interacted: false, unlockBound: false, lastPlayed: -Infinity, seen: new Set(), muted: readMuted(), muteListeners: new Set() });

function context(): AudioContext | null {
  if (S.ctx) return S.ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  S.ctx = new AC();
  return S.ctx;
}

/** Marks the page as interacted with on the first click or key press, and unlocks audio then. */
function bindUnlock() {
  if (S.unlockBound || typeof window === "undefined") return;
  S.unlockBound = true;
  const unlock = () => {
    S.interacted = true;
    void context()?.resume();
    window.removeEventListener("pointerdown", unlock, { capture: true });
    window.removeEventListener("keydown", unlock, { capture: true });
  };
  window.addEventListener("pointerdown", unlock, { capture: true });
  window.addEventListener("keydown", unlock, { capture: true });
}
bindUnlock();

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

/** Starts the tone now, unless this tab started one less than TONE_MS ago. */
function play(c: AudioContext) {
  const wall = Date.now();
  if (wall - S.lastPlayed < TONE_MS) return;
  S.lastPlayed = wall;
  const t = c.currentTime + 0.02;
  for (let r = 0; r < 2; r++) {
    const o = t + r * 0.6;
    tone(c, 880, o, 0.16);
    tone(c, 660, o + 0.2, 0.22);
  }
}

/* ---------- once per Warning, across tabs ---------- */

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
    // Keep the list short: only recent Warnings matter.
    window.localStorage.setItem(RUNG_KEY, JSON.stringify(keys.slice(-50)));
  } catch {
    // Storage blocked: this tab still rings each Warning only once (S.seen).
  }
}

/** Runs `fn` while holding the cross-tab alarm lock, or skips it if another tab holds the lock. */
function withAlarmLock(fn: () => void) {
  const locks = (navigator as Navigator & { locks?: LockManager }).locks;
  if (!locks) {
    fn();
    return;
  }
  void locks.request(LOCK_NAME, { ifAvailable: true }, async (lock) => {
    if (lock) fn();
  });
}

/** Rings once for a Warning no tab has rung yet. Silent when muted or before the first interaction. */
function ringOnce(key: string) {
  if (S.muted || !S.interacted) return;
  const c = context();
  if (!c || c.state !== "running") return;
  withAlarmLock(() => {
    const rung = readRung();
    if (rung.includes(key)) return;
    writeRung([...rung, key]);
    play(c);
  });
}

/**
 * Rings once for each unacknowledged Warning when it first appears. `keys` identify the Warnings (alert
 * ids). A Warning that appears while muted or before the first interaction is not rung later.
 */
export function useWarningTone(keys: string[]) {
  const signature = keys.join("|");
  useEffect(() => {
    for (const key of keys) {
      if (S.seen.has(key)) continue;
      S.seen.add(key);
      ringOnce(key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
}

/* ---------- mute ---------- */

/** Whether the Warning tone is muted, and a setter. Shared by every screen; kept on this device. */
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
