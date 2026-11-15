// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Replays the real DONKI event sequence on the mission clock, and the simulated habitat dose rate that follows it.
// The gaps between events are the real ones (no compression). The sequence is placed so the >100 MeV arrival
// happened 30 minutes before the moment the scenario starts. Dose is simulated: DONKI records events, not dose.
import type { SolarEvent } from "./donki";

/** A DONKI event placed on the mission clock (MET seconds). */
export interface ReplayedEvent extends SolarEvent {
  met: number;
}

/** How long before "now" the >100 MeV arrival is placed. */
export const PEAK_LEAD_SEC = 30 * 60;

export function replaySequence(seq: SolarEvent[], nowMet: number): ReplayedEvent[] {
  const peak = seq.find((e) => e.role === "peak");
  if (!peak) throw new Error("The solar sequence has no >100 MeV arrival");
  const shift = nowMet - PEAK_LEAD_SEC - peak.ms / 1000;
  return seq.map((e) => ({ ...e, met: e.ms / 1000 + shift }));
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

/** Plateau after the >10 MeV arrival (Watch while rising, then Caution above 20 µGy/h) and after the >100 MeV arrival. */
export const STORM_DOSE = { onsetLevel: 22, onsetRiseSec: 2 * 3600, peakLevel: 34, peakRiseSec: 20 * 60 } as const;

/**
 * Simulated habitat dose rate (µGy/h) at MET `t` during the replayed storm. `background` is the normal rate at
 * that moment; `fast` and `noise` are the same small wiggles the normal model uses (each about -1 to 1).
 */
export function stormDoseRate(t: number, events: ReplayedEvent[], background: number, wiggle: { fast: number; noise: number }): number {
  const onset = events.find((e) => e.role === "onset");
  const peak = events.find((e) => e.role === "peak");
  let v = background;
  if (onset) v = lerp(v, STORM_DOSE.onsetLevel + wiggle.fast * 0.8 + wiggle.noise * 0.2, smooth(clamp01((t - onset.met) / STORM_DOSE.onsetRiseSec)));
  if (peak) v = lerp(v, STORM_DOSE.peakLevel + wiggle.fast * 1.5 + wiggle.noise * 0.3, smooth(clamp01((t - peak.met) / STORM_DOSE.peakRiseSec)));
  return v;
}
