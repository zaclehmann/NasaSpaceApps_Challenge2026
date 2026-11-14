// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { describe, expect, it } from "vitest";
import { SYMPTOM_LASTING_SEC, symptomRuleText, symptomStatus, type SymptomCore } from "./symptoms";
import { DAY } from "./time";

const NOW = 141 * DAY + 14 * 3600 + 33 * 60;
const s = (over: Partial<SymptomCore> = {}): SymptomCore => ({ severity: 2, startedAt: NOW - 3600, affectsWork: false, ...over });

describe("symptomStatus (demo rules)", () => {
  it("is Watch for an active mild symptom, including severity 0", () => {
    expect(symptomStatus(s({ severity: 0 }), NOW)).toBe("watch");
    expect(symptomStatus(s({ severity: 3 }), NOW)).toBe("watch");
  });

  it("is Caution at severity 4 to 6", () => {
    expect(symptomStatus(s({ severity: 4 }), NOW)).toBe("caution");
    expect(symptomStatus(s({ severity: 6 }), NOW)).toBe("caution");
  });

  it("is Warning at severity 7 and above", () => {
    expect(symptomStatus(s({ severity: 7 }), NOW)).toBe("warning");
    expect(symptomStatus(s({ severity: 10 }), NOW)).toBe("warning");
  });

  it("is Warning when it affects work, whatever the severity", () => {
    expect(symptomStatus(s({ severity: 1, affectsWork: true }), NOW)).toBe("warning");
  });

  it("raises a mild symptom to Caution once it has lasted more than 2 days", () => {
    expect(symptomStatus(s({ startedAt: NOW - SYMPTOM_LASTING_SEC }), NOW)).toBe("watch");
    expect(symptomStatus(s({ startedAt: NOW - SYMPTOM_LASTING_SEC - 1 }), NOW)).toBe("caution");
  });

  it("does not lower a severe long symptom: worst rule wins", () => {
    expect(symptomStatus(s({ severity: 8, startedAt: NOW - 5 * DAY }), NOW)).toBe("warning");
  });

  it("has no status once resolved, even if it was severe", () => {
    expect(symptomStatus(s({ severity: 9, affectsWork: true, resolvedAt: NOW - 60 }), NOW)).toBeNull();
    expect(symptomStatus(s({ resolvedAt: NOW }), NOW)).toBeNull();
  });

  it("still counts a symptom whose resolution is in the future", () => {
    expect(symptomStatus(s({ resolvedAt: NOW + 60 }), NOW)).toBe("watch");
  });
});

describe("symptomRuleText", () => {
  it("names the rule that applied", () => {
    expect(symptomRuleText(s({ severity: 7 }), NOW)).toMatch(/severity 7/);
    expect(symptomRuleText(s({ affectsWork: true }), NOW)).toMatch(/affects your work/);
    expect(symptomRuleText(s({ severity: 5 }), NOW)).toMatch(/severity 4 to 6/);
    expect(symptomRuleText(s({ startedAt: NOW - 3 * DAY }), NOW)).toMatch(/more than 2 days/);
    expect(symptomRuleText(s(), NOW)).toMatch(/Watch/);
    expect(symptomRuleText(s({ resolvedAt: NOW - 1 }), NOW)).toMatch(/Resolved/);
  });
});
