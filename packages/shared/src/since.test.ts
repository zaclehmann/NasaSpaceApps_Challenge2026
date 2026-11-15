// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// "Out of range since" looks back past the last hour, through longer history, up to 48 hours.
import { describe, expect, it } from "vitest";
import { OUT_OF_RANGE_LOOKBACK_SEC, evaluate, lookbackHistory } from "./status";
import type { Reading } from "./types";

const NOW = 141 * 86400 + 14 * 3600 + 33 * 60;
const H = 3600;
/** Radiation readings from `from` to `to` (MET seconds) every `step` seconds, at `value(t)`. */
const series = (from: number, to: number, step: number, value: (t: number) => number): Reading[] => {
  const out: Reading[] = [];
  for (let t = from; t <= to; t += step) out.push({ t, value: value(t), device: "dosimeter" });
  return out;
};
const storm = (start: number) => (t: number) => (t >= start ? 30 : 9);

describe("out of range since", () => {
  it("looks back through history past the last hour", () => {
    const start = NOW - 11.5 * H;
    const hour = series(NOW - H, NOW, 60, storm(start));
    const history = () => series(NOW - 24 * H, NOW, 600, storm(start));
    const ev = evaluate("radiation", hour, { now: NOW, history });
    expect(ev.status).toBe("caution");
    expect(ev.since).toBe(start);
  });

  it("without history, stops at the start of the readings it was given", () => {
    const hour = series(NOW - H, NOW, 60, storm(NOW - 11.5 * H));
    expect(evaluate("radiation", hour, { now: NOW }).since).toBe(NOW - H);
  });

  it("never looks back more than 48 hours", () => {
    const hour = series(NOW - H, NOW, 60, () => 30);
    const history = () => series(NOW - 7 * 24 * H, NOW, H, () => 30);
    const since = evaluate("radiation", hour, { now: NOW, history }).since!;
    expect(NOW - since).toBeLessThanOrEqual(OUT_OF_RANGE_LOOKBACK_SEC);
    expect(NOW - since).toBeGreaterThan(OUT_OF_RANGE_LOOKBACK_SEC - 2 * H);
  });

  it("joins the 24-hour detail onto the older 7-day series without overlap", () => {
    const day = series(NOW - 24 * H, NOW, 600, () => 9);
    const week = series(NOW - 7 * 24 * H, NOW, H, () => 9);
    const h = lookbackHistory((w) => (w === "24h" ? day : week));
    const t = h.map((r) => r.t);
    expect(t).toEqual([...t].sort((a, b) => a - b));
    expect(new Set(t).size).toBe(t.length);
    expect(h[h.length - 1].t).toBe(NOW);
  });

  it("works for entered readings too: blood pressure high on two mornings dates from the first", () => {
    const d = 86400;
    const bp: Reading[] = [
      { t: NOW - 3 * d, value: 120, value2: 78, device: "cuff" },
      { t: NOW - 2 * d + 600, value: 148, value2: 92, device: "cuff" },
      { t: NOW - d, value: 150, value2: 93, device: "cuff" },
      { t: NOW - 600, value: 149, value2: 92, device: "cuff" },
    ];
    const ev = evaluate("bp", bp, { now: NOW });
    expect(ev.status).toBe("caution");
    expect(ev.since).toBe(NOW - 2 * d + 600);
  });
});
