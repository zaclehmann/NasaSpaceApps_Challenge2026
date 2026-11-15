// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Press feedback for every control: a short, quiet key tick like the keypad on a patient monitor or
// infusion pump, and on touch screens a very short vibration. One listener for the whole app, so new
// buttons get it without any wiring. It fires on press (pointer down, or Enter and Space on the keyboard),
// not on release, the way a physical key does. Disabled controls stay silent.
//
// Off switch: "Click feedback" in the sidebar turns off both the tick and the vibration. It never silences
// the due alarm or the Warning tone; alarms always sound.
// Vibration needs the Vibration API (Android browsers); iPhone browsers do not offer it to web pages,
// so they get the tick only.
import { useEffect, useState } from "react";

const PREF_KEY = "missionvitals.clickFeedback";

/** What counts as a control. Plain text, labels and the page background never tick. */
const CONTROL = [
  "button",
  "a[href]",
  "select",
  "summary",
  "input[type=checkbox]",
  "input[type=radio]",
  "[role=button]",
  "[role=tab]",
  "[role=radio]",
  "[role=switch]",
  "[role=menuitem]",
  "[role=option]",
].join(",");

interface FeedbackState {
  ctx: AudioContext | null;
  installed: boolean;
  enabled: boolean;
  last: number;
  listeners: Set<(on: boolean) => void>;
}

function readPref(): boolean {
  try {
    return window.localStorage.getItem(PREF_KEY) !== "0";
  } catch {
    return true;
  }
}

// One object on globalThis, so a hot reload while developing never installs a second listener.
const G = globalThis as unknown as { __missionvitalsClick?: FeedbackState };
const S: FeedbackState = (G.__missionvitalsClick ??= { ctx: null, installed: false, enabled: readPref(), last: 0, listeners: new Set() });

function context(): AudioContext | null {
  if (S.ctx) return S.ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  S.ctx = new AC();
  return S.ctx;
}

/** A 22 ms tick at 1.9 kHz: quick rise, quick fall, quiet. Short enough never to blur into the next. */
function tick() {
  const c = context();
  if (!c) return;
  // Every call here runs inside a press, so resuming is allowed even on the very first one.
  if (c.state !== "running") void c.resume();
  const t = c.currentTime + 0.005;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = 1900;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.07, t + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.03);
}

function isControl(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const el = target.closest(CONTROL);
  if (!el) return false;
  if (el.matches(":disabled") || el.getAttribute("aria-disabled") === "true") return false;
  return true;
}

function feedback(withVibration: boolean) {
  if (!S.enabled) return;
  // A press and the key or click that follows it count once.
  const now = performance.now();
  if (now - S.last < 60) return;
  S.last = now;
  tick();
  if (withVibration && "vibrate" in navigator) navigator.vibrate(8);
}

/** Installs the one app-wide listener. Safe to call more than once. */
export function installClickFeedback() {
  if (S.installed) return;
  S.installed = true;
  window.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== 0 || !isControl(e.target)) return;
      feedback(e.pointerType === "touch" || e.pointerType === "pen");
    },
    { capture: true, passive: true },
  );
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.repeat || (e.key !== "Enter" && e.key !== " ")) return;
      if (!isControl(e.target)) return;
      feedback(false);
    },
    { capture: true },
  );
}

/** The "Click feedback" setting: [on, set]. Kept on this device. */
export function useClickFeedback(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(S.enabled);
  useEffect(() => {
    S.listeners.add(setOn);
    return () => {
      S.listeners.delete(setOn);
    };
  }, []);
  const set = (v: boolean) => {
    S.enabled = v;
    try {
      window.localStorage.setItem(PREF_KEY, v ? "1" : "0");
    } catch {
      // The choice lasts for this visit only.
    }
    S.listeners.forEach((l) => l(v));
  };
  return [on, set];
}
