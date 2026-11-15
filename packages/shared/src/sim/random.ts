// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Seeded randomness for the simulator. Same seed, same data on every load and on every machine (browser or server).

export const SEED = 20261114;

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function strHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Deterministic value in [0, 1) for a channel and an integer position. */
export function hash(channel: number, n: number): number {
  let h = (channel ^ Math.imul(n | 0, 0x9e3779b1) ^ SEED) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth, bounded drift in [-1, 1]: random lattice values joined with a smooth step. It always pulls back toward zero. */
export function drift(channel: number, t: number, periodSec: number): number {
  const x = t / periodSec;
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  const a = hash(channel, i) * 2 - 1;
  const b = hash(channel, i + 1) * 2 - 1;
  return a + (b - a) * s;
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
