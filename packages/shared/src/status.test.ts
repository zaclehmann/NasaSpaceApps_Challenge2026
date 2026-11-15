// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { describe, expect, it } from "vitest";
import { evaluate, getStatus, ruleText, statusLine, trendArrow, type RoutineContext } from "./status";
import { DAY } from "./time";
import { worstStatus, type GlucoseTiming, type IndicatorKey, type Reading, type Status } from "./types";

const NOW = 141 * DAY + 14 * 3600 + 33 * 60;
const one = (value: number, value2?: number, t = NOW, timing?: GlucoseTiming): Reading[] => [{ t, value, value2, timing, device: "self" }];
const at = (key: IndicatorKey, value: number, value2?: number): Status => getStatus(key, one(value, value2), { now: NOW });

/** One entered reading per day, the last one today. */
const daily = (values: number[], second?: number[], timing?: GlucoseTiming): Reading[] =>
  values.map((v, i) => ({ t: NOW - (values.length - 1 - i) * DAY, value: v, value2: second?.[i], timing, device: "self" }));

/** Live readings once a minute for the last 75 minutes. */
const live = (fn: (minAgo: number) => number): Reading[] => {
  const out: Reading[] = [];
  for (let m = 75; m >= 0; m--) out.push({ t: NOW - m * 60, value: fn(m), device: "shirt" });
  return out;
};

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
    ["exercise", 59, "caution"], ["exercise", 60, "caution"], ["exercise", 119, "caution"], ["exercise", 120, "ok"], ["exercise", 200, "ok"],
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
    [120, 59, "caution"], [100, 50, "caution"],
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

describe("glucose depends on when it was taken", () => {
  const glu = (v: number, timing?: GlucoseTiming) => getStatus("glucose", one(v, undefined, NOW, timing), { now: NOW });
  it("uses 70 to 110 fasting and before a meal", () => {
    expect(glu(110, "fasting")).toBe("ok");
    expect(glu(111, "fasting")).toBe("caution");
    expect(glu(111, "before-meal")).toBe("caution");
    expect(glu(111)).toBe("caution");
  });
  it("uses 70 to 140 after a meal, with the same caution and warning bands", () => {
    expect(glu(130, "after-meal")).toBe("ok");
    expect(glu(140, "after-meal")).toBe("ok");
    expect(glu(141, "after-meal")).toBe("caution");
    expect(glu(180, "after-meal")).toBe("caution");
    expect(glu(181, "after-meal")).toBe("warning");
    expect(glu(69, "after-meal")).toBe("caution");
    expect(glu(54, "after-meal")).toBe("warning");
  });
});

describe("two-day rules", () => {
  const day = (offset: number, value: number): Reading => ({ t: NOW - offset * DAY, value, device: "self" });
  it("mood: Caution for a single Very low, Warning on two days running", () => {
    expect(getStatus("mood", [day(1, 3), day(0, 1)], { now: NOW })).toBe("caution");
    expect(getStatus("mood", [day(1, 1), day(0, 1)], { now: NOW })).toBe("warning");
    expect(getStatus("mood", [day(2, 1), day(0, 1)], { now: NOW })).toBe("caution");
  });
  it("exercise: Caution below 60 once, Warning below 60 on two days running", () => {
    expect(getStatus("exercise", [day(1, 130), day(0, 50)], { now: NOW })).toBe("caution");
    expect(getStatus("exercise", [day(1, 59), day(0, 50)], { now: NOW })).toBe("warning");
    expect(getStatus("exercise", [day(1, 60), day(0, 50)], { now: NOW })).toBe("caution");
    expect(getStatus("exercise", [day(2, 50), day(0, 50)], { now: NOW })).toBe("caution");
  });
});

describe("watch: fixed margins and a trend toward the limit", () => {
  it("heart rate: 6 bpm inside either limit, over the last hour", () => {
    expect(getStatus("hr", live((m) => 104 - m * 0.2), { now: NOW })).toBe("watch");
    expect(getStatus("hr", live((m) => 103 - m * 0.2), { now: NOW })).toBe("ok");
    expect(getStatus("hr", live((m) => 56 + m * 0.2), { now: NOW })).toBe("watch");
    expect(getStatus("hr", live((m) => 57 + m * 0.2), { now: NOW })).toBe("ok");
  });
  it("heart rate: near the limit but steady or moving away is In range", () => {
    expect(getStatus("hr", live(() => 104), { now: NOW })).toBe("ok");
    expect(getStatus("hr", live((m) => 104 + m * 0.2), { now: NOW })).toBe("ok");
  });
  it("SpO₂: 1 % above the limit, so a normal 97 or 98 is never Watch", () => {
    expect(getStatus("spo2", live((m) => (m > 30 ? 97 : 95)), { now: NOW })).toBe("watch");
    expect(getStatus("spo2", live((m) => (m > 30 ? 98 : 96)), { now: NOW })).toBe("ok");
    expect(getStatus("spo2", live((m) => (m > 30 ? 99 : 97)), { now: NOW })).toBe("ok");
  });
  it("temperature: 0.3 °C inside either limit, over the last 3 days", () => {
    expect(getStatus("temp", daily([36.7, 36.8, 36.9, 37.2]), { now: NOW })).toBe("watch");
    expect(getStatus("temp", daily([36.7, 36.8, 36.9, 37.1]), { now: NOW })).toBe("ok");
    expect(getStatus("temp", daily([36.7, 36.6, 36.5, 36.3]), { now: NOW })).toBe("watch");
    expect(getStatus("temp", daily([36.7, 36.6, 36.5, 36.4]), { now: NOW })).toBe("ok");
  });
  it("blood pressure: systolic 10, diastolic 5", () => {
    expect(getStatus("bp", daily([118, 120, 122, 125], [76, 76, 76, 76]), { now: NOW })).toBe("watch");
    expect(getStatus("bp", daily([118, 120, 122, 124], [76, 76, 76, 76]), { now: NOW })).toBe("ok");
    expect(getStatus("bp", daily([118, 118, 118, 118], [74, 76, 78, 80]), { now: NOW })).toBe("watch");
    expect(getStatus("bp", daily([118, 118, 118, 118], [74, 76, 78, 79]), { now: NOW })).toBe("ok");
    expect(getStatus("bp", daily([118, 118, 118, 118], [72, 70, 68, 64]), { now: NOW })).toBe("watch");
  });
  it("blood pressure: a creeping 131/84 is Watch", () => {
    expect(evaluate("bp", daily([123, 125, 127, 131], [79, 80, 81, 84]), { now: NOW })).toMatchObject({ status: "watch", reason: "trend" });
  });
  it("glucose: 10 mg/dL inside the limit for its timing", () => {
    expect(getStatus("glucose", daily([90, 92, 95, 100]), { now: NOW })).toBe("watch");
    expect(getStatus("glucose", daily([90, 92, 95, 99]), { now: NOW })).toBe("ok");
    expect(getStatus("glucose", daily([95, 100, 110, 130], undefined, "after-meal"), { now: NOW })).toBe("watch");
    expect(getStatus("glucose", daily([95, 100, 110, 129], undefined, "after-meal"), { now: NOW })).toBe("ok");
  });
  it("sleep: 0.5 h above the limit", () => {
    expect(getStatus("sleep", daily([7.2, 7.0, 6.9, 6.5]), { now: NOW })).toBe("watch");
    expect(getStatus("sleep", daily([7.2, 7.0, 6.9, 6.6]), { now: NOW })).toBe("ok");
  });
  it("exercise: 15 min above the target", () => {
    expect(getStatus("exercise", daily([150, 145, 140, 135]), { now: NOW })).toBe("watch");
    expect(getStatus("exercise", daily([150, 145, 140, 136]), { now: NOW })).toBe("ok");
  });
  it("radiation: 2 µGy/h below the limit", () => {
    expect(getStatus("radiation", live((m) => (m > 30 ? 15 : 18)), { now: NOW })).toBe("watch");
    expect(getStatus("radiation", live((m) => (m > 30 ? 15 : 17.9)), { now: NOW })).toBe("ok");
  });
  it("entered readings only look back 3 days", () => {
    const rs: Reading[] = [
      { t: NOW - 5 * DAY, value: 100, value2: 70, device: "cuff" },
      { t: NOW - 2 * DAY, value: 124, value2: 76, device: "cuff" },
      { t: NOW - 1 * DAY, value: 124, value2: 76, device: "cuff" },
      { t: NOW, value: 125, value2: 76, device: "cuff" },
    ];
    expect(getStatus("bp", rs, { now: NOW })).toBe("ok");
  });
  it("does not downgrade an out-of-range reading to Watch", () => {
    expect(getStatus("bp", one(150, 90), { now: NOW, routine: "overdue" })).toBe("caution");
  });
});

describe("due, overdue and no data for entered measurements", () => {
  const yesterday = one(96, undefined, NOW - DAY);
  const ctx = (routine: RoutineContext) => ({ now: NOW, routine });
  it("is Due before its time and for the first hour after it", () => {
    expect(getStatus("mood", [], ctx("upcoming"))).toBe("due");
    expect(getStatus("mood", [], ctx("due"))).toBe("due");
    expect(getStatus("glucose", yesterday, ctx("due"))).toBe("due");
  });
  it("is Watch once the check is overdue", () => {
    expect(evaluate("mood", [], ctx("overdue"))).toMatchObject({ status: "watch", reason: "overdue" });
  });
  it("is No data if the day ends without it, or there is no routine for it", () => {
    expect(getStatus("glucose", yesterday, ctx("missed"))).toBe("nodata");
    expect(getStatus("glucose", yesterday, ctx("none"))).toBe("nodata");
    expect(getStatus("mood", [], { now: NOW })).toBe("nodata");
  });
  it("keeps today's reading when a second check of the day is overdue", () => {
    expect(getStatus("bp", one(118, 76), ctx("overdue"))).toBe("watch");
    expect(getStatus("bp", one(118, 76), ctx("upcoming"))).toBe("ok");
  });
  it("Due never makes the overall status worse", () => {
    expect(worstStatus(["ok", "due"])).toBe("ok");
    expect(worstStatus(["due", "watch"])).toBe("watch");
  });
});

describe("live sensors", () => {
  it("are No data when silent for more than 3x their interval", () => {
    expect(getStatus("hr", one(72, undefined, NOW - 15), { now: NOW })).toBe("ok");
    expect(getStatus("hr", one(72, undefined, NOW - 16), { now: NOW })).toBe("nodata");
    expect(getStatus("radiation", one(9, undefined, NOW - 180), { now: NOW })).toBe("ok");
    expect(getStatus("radiation", one(9, undefined, NOW - 181), { now: NOW })).toBe("nodata");
    expect(getStatus("hr", [], { now: NOW })).toBe("nodata");
  });
  it("never report a stale out-of-range value as current", () => {
    expect(getStatus("spo2", one(88, undefined, NOW - 600), { now: NOW })).toBe("nodata");
  });
});

describe("explanations", () => {
  it("says how long a live value has been out of range", () => {
    const rs: Reading[] = [];
    for (let s = 1200; s >= 0; s -= 5) rs.push({ t: NOW - s, value: s > 540 ? 90 : 119, device: "shirt" });
    const ev = evaluate("hr", rs, { now: NOW });
    expect(ev.status).toBe("caution");
    expect(statusLine("hr", ev, NOW)).toBe("Above your range of 50 to 110 bpm for 9 minutes.");
  });
  it("says demo limit and demo target wherever a sentence names one; in-range sentences stay plain", () => {
    const inRange: [IndicatorKey, number][] = [["hr", 80], ["spo2", 97], ["temp", 36.7], ["glucose", 90], ["sleep", 7], ["exercise", 130], ["radiation", 9]];
    for (const [k, v] of inRange) {
      const line = statusLine(k, evaluate(k, one(v), { now: NOW }), NOW);
      if (k === "exercise") expect(line).toMatch(/demo target/);
      else expect(line).not.toMatch(/demo/i);
    }
    expect(statusLine("bp", evaluate("bp", one(148, 92), { now: NOW }), NOW)).toBe("Systolic 148 mmHg is above the demo limit of 135 mmHg.");
    expect(statusLine("bp", evaluate("bp", one(118, 58), { now: NOW }), NOW)).toBe("Diastolic 58 mmHg is below the demo limit of 60 mmHg.");
  });
  it("uses the after-meal range for an after-meal glucose reading", () => {
    const ev = evaluate("glucose", one(150, undefined, NOW, "after-meal"), { now: NOW });
    expect(statusLine("glucose", ev, NOW)).toBe("Above your range of 70 to 140 mg/dL after a meal.");
    expect(ruleText("glucose", ev)).toBe("Rule: Caution when blood glucose after a meal is above 140 mg/dL.");
  });
  it("explains exercise against the target", () => {
    expect(statusLine("exercise", evaluate("exercise", one(90), { now: NOW }), NOW)).toBe("90 minutes today. Below the demo target of 120 minutes.");
    const two: Reading[] = [{ t: NOW - DAY, value: 40, device: "shirt" }, { t: NOW, value: 45, device: "shirt" }];
    expect(statusLine("exercise", evaluate("exercise", two, { now: NOW }), NOW)).toBe("Below 60 minutes on two days running. The demo target is 120 minutes a day.");
  });
  it("reports missing data as a duration, not a number", () => {
    expect(statusLine("spo2", evaluate("spo2", one(97, undefined, NOW - 360), { now: NOW }), NOW)).toBe("No reading for 6 minutes.");
    expect(statusLine("mood", evaluate("mood", [], { now: NOW, routine: "due" }), NOW)).toBe("Not taken yet today.");
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
