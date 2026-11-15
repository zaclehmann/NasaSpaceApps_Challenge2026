// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { describe, expect, it } from "vitest";
import raw from "../../data/donki-2024-05.json";
import { INDICATORS } from "../indicators";
import { DONKI, SOLAR_SEQUENCE, parseDonki, solarSequence } from "./donki";
import { PEAK_LEAD_SEC, replaySequence, stormDoseRate } from "./replay";

const NOW = 141 * 86400 + 14 * 3600 + 33 * 60;
const still = { fast: 0, noise: 0 };

describe("DONKI loader", () => {
  it("accepts the committed file", () => expect(DONKI.sep.length).toBeGreaterThan(0));
  it("rejects a particle event with no eventTime", () => {
    const bad = JSON.parse(JSON.stringify(raw)) as { sep: Record<string, unknown>[] };
    delete bad.sep[0].eventTime;
    expect(() => parseDonki(bad)).toThrow(/eventTime/);
  });
  it("rejects a file that is not an object", () => expect(() => parseDonki([])).toThrow(/malformed/));
});

describe("solar storm sequence", () => {
  it("is in time order", () => {
    const t = SOLAR_SEQUENCE.map((e) => e.ms);
    expect(t).toEqual([...t].sort((a, b) => a - b));
  });
  it("contains a flare, a CME and both GOES particle arrivals", () => {
    const shorts = SOLAR_SEQUENCE.map((e) => e.short);
    expect(shorts).toContain("Flare");
    expect(shorts).toContain("CME");
    expect(shorts).toContain(">10 MeV");
    expect(shorts).toContain(">100 MeV");
  });
  it("comes from the data, not hard-coded times", () => {
    const onset = DONKI.sep.find((s) => s.instruments.some((i) => i.includes("GOES") && i.includes(">10 MeV")) && s.eventTime.startsWith("2024-05-10"));
    expect(SOLAR_SEQUENCE.find((e) => e.role === "onset")?.time).toBe(onset?.eventTime);
  });
  it("fails clearly when a GOES arrival is missing", () => {
    expect(() => solarSequence({ ...DONKI, sep: DONKI.sep.filter((s) => !s.instruments.some((i) => i.includes(">100 MeV"))) })).toThrow(/>100 MeV/);
  });
});

describe("replay on the mission clock", () => {
  const ev = replaySequence(SOLAR_SEQUENCE, NOW);
  const onset = ev.find((e) => e.role === "onset")!;
  const peak = ev.find((e) => e.role === "peak")!;

  it("keeps the real gap between the >10 MeV and >100 MeV arrivals, to the minute", () => {
    const realMin = Math.round((peak.ms - onset.ms) / 60000);
    expect(Math.round((peak.met - onset.met) / 60)).toBe(realMin);
  });
  it("places the >100 MeV arrival 30 minutes before now", () => expect(NOW - peak.met).toBe(PEAK_LEAD_SEC));
  it("fits the whole sequence inside the last 24 hours", () => expect(NOW - ev[0].met).toBeLessThan(24 * 3600));
  it("puts the dose rate at now in the Caution band", () => {
    const v = stormDoseRate(NOW, ev, 9.1, still);
    const high = INDICATORS.radiation.high!;
    expect(v).toBeGreaterThanOrEqual(high);
    expect(v).toBeLessThan(50);
  });
  it("stays at background before the >10 MeV arrival", () => expect(stormDoseRate(onset.met - 60, ev, 9.1, still)).toBeCloseTo(9.1));
  it("is above the limit between the two arrivals", () => expect(stormDoseRate(peak.met - 3600, ev, 9.1, still)).toBeGreaterThan(20));
});
