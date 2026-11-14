// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { describe, expect, it } from "vitest";
import { evaluate, getStatus, statusLine, trendArrow } from "./status";
import { DAY } from "./time";
import { worstStatus, type IndicatorKey, type Reading, type Status } from "./types";

const NOW = 141 * DAY + 14 * 3600 + 33 * 60;
const one = (value: number, value2?: number, t = NOW): Reading[] => [{ t, value, value2, device: "self" }];
const at = (key: IndicatorKey, value: number, value2?: number): Status => getStatus(key, one(value, value2), { now: NOW });

describe("demo threshold boundaries", () => {
  const cases: [IndicatorKey, number, Status][] = [
    ["hr", 39, "warning"], ["hr", 40, "caution"], ["hr", 49, "caution"], ["hr", 50, "ok"], ["hr", 110, "ok"],
    ["hr", 111, "caution"], ["hr", 140, "caution"], ["hr", 141, "warning"],
    ["spo2", 89, "warning"], ["spo2", 90, "caution"], ["spo2", 93, "caution"], ["spo2", 94, "ok"], ["spo2", 100, "ok"],
    ["temp", 35.4, "warning"], ["temp", 35.5, "caution"], ["temp", 35.9, "caution"], ["temp", 36.0, "ok"], ["temp", 37.5, "ok"],
    ["temp", 37.6, "caution"], ["temp", 38.4, "caution"], ["temp", 38.5, "warning"],
    ["glucose", 54, "warning"], ["glucose", 55, "caution"], ["glucose", 69, "caution"], ["glucose", 70, "ok"], ["glucose", 110, "ok"],
    ["glucose", 111, "caution"], ["glucose", 180, "caution"], ["glucose", 181, "warning"],
    ["sleep", 4.9, "warning"], ["sleep", 5.0, "caution"], ["sleep", 5.9, "caution"], ["sleep", 6.0, "ok"],
    ["mood", 3, "ok"], ["mood", 5, "ok"], ["mood", 2, "caution"], ["mood", 1, "caution"],
    ["radiation", 19.9, "ok"], ["radiation", 20, "caution"], ["radiation", 50, "caution"], ["radiation", 50.1, "warning"],
  ];
  it.each(cases)("%s %s is %s", (key, value, expected) => {
    expect(at(key, value)).toBe(expected);
  });

  const bp: [number, number, Status][] = [
    [118, 76, "ok"], [90, 60, "ok"], [135, 85, "ok"],
    [136, 80, "caution"], [159, 80, "caution"], [160, 80, "warning"],
    [89, 60, "caution"], [80, 55, "caution"], [79, 55, "warning"],
    [120, 86, "caution"], [120, 99, "caution"], [120, 100, "warning"],
  ];
  it.each(bp)("bp %s/%s is %s", (s, d, expected) => {
    expect(at("bp", s, d)).toBe(expected);
  });

  it("classifies the value as shown on screen", () => {
    expect(at("hr", 110.4)).toBe("ok");
    expect(at("hr", 110.6)).toBe("caution");
    expect(at("temp", 37.54)).toBe("ok");
  });
});

describe("mood two-day rule", () => {
  const day = (offset: number, value: number): Reading => ({ t: NOW - offset * DAY, value, device: "self" });
  it("is Caution for a single Very low", () => {
    expect(getStatus("mood", [day(1, 3), day(0, 1)], { now: NOW })).toBe("caution");
  });
  it("is Warning for Very low on two days running", () => {
    expect(getStatus("mood", [day(1, 1), day(0, 1)], { now: NOW })).toBe("warning");
  });
  it("needs the days to be consecutive", () => {
    expect(getStatus("mood", [day(2, 1), day(0, 1)], { now: NOW })).toBe("caution");
  });
});

describe("watch", () => {
  const live = (fn: (minAgo: number) => number): Reading[] => {
    const out: Reading[] = [];
    for (let m = 75; m >= 0; m--) out.push({ t: NOW - m * 60, value: fn(m), device: "shirt" });
    return out;
  };
  it("is Watch when near a limit and moving toward it over the last hour", () => {
    expect(getStatus("hr", live((m) => 104 - m * 0.2), { now: NOW })).toBe("watch");
  });
  it("is In range when near a limit but steady", () => {
    expect(getStatus("hr", live(() => 104), { now: NOW })).toBe("ok");
  });
  it("is In range when near a limit but moving away", () => {
    expect(getStatus("hr", live((m) => 100 + m * 0.2), { now: NOW })).toBe("ok");
  });
  it("is In range when rising but far from the limit", () => {
    expect(getStatus("hr", live((m) => 85 - m * 0.2), { now: NOW })).toBe("ok");
  });
  it("watches a falling SpO2 at the limit", () => {
    expect(getStatus("spo2", live((m) => (m > 30 ? 97 : 94)), { now: NOW })).toBe("watch");
    expect(getStatus("spo2", live((m) => (m > 30 ? 98 : 96)), { now: NOW })).toBe("ok");
  });
  it("watches entered readings against recent ones", () => {
    const rising: Reading[] = [3, 2, 1, 0].map((d, i) => ({ t: NOW - d * DAY, value: [118, 120, 122, 130][i], value2: [76, 77, 78, 84][i], device: "cuff" }));
    const ev = evaluate("bp", rising, { now: NOW });
    expect(ev.status).toBe("watch");
    expect(ev.reason).toBe("trend");
  });
  it("is Watch when a routine measurement is overdue", () => {
    expect(getStatus("bp", one(118, 76), { now: NOW, routine: "overdue" })).toBe("watch");
    expect(getStatus("mood", [], { now: NOW, routine: "overdue" })).toBe("watch");
  });
  it("does not downgrade an out-of-range reading to Watch", () => {
    expect(getStatus("bp", one(150, 90), { now: NOW, routine: "overdue" })).toBe("caution");
  });
});

describe("no data", () => {
  it("is No data with no readings", () => {
    expect(getStatus("hr", [], { now: NOW })).toBe("nodata");
    expect(getStatus("mood", [], { now: NOW })).toBe("nodata");
  });
  it("is No data when a live source is silent for more than 3x its interval", () => {
    expect(getStatus("hr", one(72, undefined, NOW - 15), { now: NOW })).toBe("ok");
    expect(getStatus("hr", one(72, undefined, NOW - 16), { now: NOW })).toBe("nodata");
    expect(getStatus("radiation", one(9, undefined, NOW - 180), { now: NOW })).toBe("ok");
    expect(getStatus("radiation", one(9, undefined, NOW - 181), { now: NOW })).toBe("nodata");
  });
  it("is No data when an entered measurement was not taken today", () => {
    expect(getStatus("glucose", one(96, undefined, NOW - DAY), { now: NOW })).toBe("nodata");
    expect(getStatus("glucose", one(96, undefined, NOW - 3600), { now: NOW })).toBe("ok");
  });
  it("never reports a stale out-of-range value as current", () => {
    expect(getStatus("spo2", one(88, undefined, NOW - 600), { now: NOW })).toBe("nodata");
  });
});

describe("explanations", () => {
  it("says how long a live value has been out of range", () => {
    const rs: Reading[] = [];
    for (let s = 1200; s >= 0; s -= 5) rs.push({ t: NOW - s, value: s > 540 ? 90 : 119, device: "shirt" });
    const ev = evaluate("hr", rs, { now: NOW });
    expect(ev.status).toBe("caution");
    expect(statusLine("hr", ev, NOW)).toBe("Above your demo range of 50 to 110 bpm for 9 minutes.");
  });
  it("labels every threshold as demo", () => {
    const keys: IndicatorKey[] = ["hr", "spo2", "temp", "glucose", "sleep", "radiation"];
    for (const k of keys) expect(statusLine(k, evaluate(k, one(k === "spo2" ? 97 : k === "temp" ? 36.7 : k === "sleep" ? 7 : k === "radiation" ? 9 : 80), { now: NOW }), NOW)).toContain("demo");
    expect(statusLine("bp", evaluate("bp", one(148, 92), { now: NOW }), NOW)).toBe("Systolic 148 mmHg is above the demo limit of 135 mmHg.");
  });
  it("reports missing data as a duration, not a number", () => {
    expect(statusLine("spo2", evaluate("spo2", one(97, undefined, NOW - 360), { now: NOW }), NOW)).toBe("No reading for 6 minutes.");
  });
});

describe("helpers", () => {
  it("worst status wins", () => {
    expect(worstStatus(["ok", "nodata", "watch"])).toBe("watch");
    expect(worstStatus(["ok", "caution", "warning", "watch"])).toBe("warning");
    expect(worstStatus(["ok", "nodata"])).toBe("nodata");
    expect(worstStatus([])).toBe("ok");
  });
  it("gives a trend arrow", () => {
    const rs: Reading[] = [];
    for (let s = 900; s >= 0; s -= 5) rs.push({ t: NOW - s, value: 119 - s / 30, device: "shirt" });
    expect(trendArrow("hr", rs, NOW)).toBe("up");
    expect(trendArrow("hr", rs.map((r) => ({ ...r, value: 70 })), NOW)).toBe("flat");
  });
});
