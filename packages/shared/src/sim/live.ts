// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Live signals (heart rate, SpO₂, habitat radiation): baseline + daily rhythm + slow mean-reverting drift + small
// noise, with each scenario's overlay. Pure functions of the scenario, the astronaut and the time.
import { DAY } from "../time";
import { INDICATORS, WINDOW_SEC, sampleStepSec } from "../indicators";
import { SOLAR_SEQUENCE } from "../radiation/donki";
import { replaySequence, stormDoseRate, type ReplayedEvent } from "../radiation/replay";
import type { ChartWindow, IndicatorKey, Reading, ScenarioId } from "../types";
import { BASE, MIN, RADIATION_BASE, TICK_SEC } from "./crew";
import { clamp01, drift, hash, lerp, strHash } from "./random";

/** What the simulated data depends on besides time: the scenario, whose data it changes, and when it started. */
export interface SimScenario {
  scenario: ScenarioId;
  /** The astronaut whose data the scenario changes. Radiation is crew-wide. */
  target: string;
  /** The scenario's story is told relative to this MET (when it was chosen). */
  anchor: number;
}

let stormCache: { anchor: number; events: ReplayedEvent[] } | null = null;

/** The NASA DONKI solar storm sequence placed on the mission clock for this scenario. Empty in other scenarios. */
export function solarEvents(s: SimScenario): ReplayedEvent[] {
  if (s.scenario !== "solar-event") return [];
  if (stormCache?.anchor !== s.anchor) stormCache = { anchor: s.anchor, events: replaySequence(SOLAR_SEQUENCE, s.anchor) };
  return stormCache.events;
}

/** The live value at MET `t`, or null when there is no reading (a silent sensor, or not a live indicator). */
export function liveValue(s: SimScenario, astronautId: string, key: IndicatorKey, t: number): number | null {
  const onTarget = astronautId === s.target;
  const dt = t - s.anchor;
  const dayAngle = ((t % DAY) / DAY - 0.42) * 2 * Math.PI;
  const rhythm = Math.cos(dayAngle);
  const ch = strHash(`${key}:${key === "radiation" ? "habitat" : astronautId}`);
  const slow = drift(ch, t, 3 * 3600);
  const fast = drift(ch + 1, t, 20 * MIN);
  const noise = hash(ch + 2, Math.floor(t / TICK_SEC)) * 2 - 1;

  if (key === "radiation") {
    const v = RADIATION_BASE + slow * 1.2 + fast * 0.4 + noise * 0.15;
    // Solar storm: the real NASA DONKI event sequence (May 2024) on the mission clock; the dose is simulated.
    return s.scenario === "solar-event" ? stormDoseRate(t, solarEvents(s), v, { fast, noise }) : v;
  }

  const b = BASE[astronautId];
  if (!b) return null;
  if (s.scenario === "sensor-dropout" && onTarget && (key === "spo2" || key === "hr") && dt > -6 * MIN) return null;

  if (key === "hr") {
    // A daily exercise session at 16:00 lifts heart rate for about 45 minutes.
    const clock = t % DAY;
    const ex = Math.max(0, 1 - Math.abs(clock - (16 * 3600 + 22 * MIN)) / (26 * MIN));
    let v = b.hr + rhythm * 4 + slow * 3 + fast * 2 + noise * 1.2 + ex * ex * (3 - 2 * ex) * 24;
    if (s.scenario === "hr-exercise" && onTarget) {
      const f = clamp01((dt + 21 * MIN) / (14 * MIN));
      v = lerp(v, 119 + fast * 1.5 + noise * 0.8 + clamp01(dt / (20 * MIN)) * 2, f);
    }
    return v;
  }
  if (key === "spo2") {
    let v = Math.min(100, b.spo2 + slow * 0.4 + fast * 0.3 + noise * 0.3);
    if (s.scenario === "low-spo2" && onTarget) {
      const f = clamp01((dt + 13 * MIN) / (9 * MIN));
      v = lerp(v, 88 + fast * 0.2 + noise * 0.2, f);
    }
    return v;
  }
  // Only heart rate, SpO₂ and radiation are live. Temperature comes from the thermometer.
  return null;
}

/** A chart window of live readings ending at `end` (MET), at the window's sample step, oldest first. */
export function sampleLive(s: SimScenario, astronautId: string, key: IndicatorKey, window: ChartWindow, end: number): Reading[] {
  const def = INDICATORS[key];
  const step = sampleStepSec(key, window);
  const start = end - WINDOW_SEC[window];
  const out: Reading[] = [];
  const push = (t: number) => {
    const v = liveValue(s, astronautId, key, t);
    if (v !== null) out.push({ t, value: v, device: def.device });
  };
  const first = Math.ceil(start / step) * step;
  for (let t = first; t < end; t += step) push(t);
  push(end);
  return out;
}
