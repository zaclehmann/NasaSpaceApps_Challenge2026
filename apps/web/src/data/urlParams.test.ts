// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// A ?scenario= link is applied on the first visit or a real change, never again on reload, so entered readings stay.
import { describe, expect, it, vi } from "vitest";
import { MockSource } from "./mockSource";
import { applyUrlParams } from "./urlParams";

describe("demo links", () => {
  it("applies a scenario that differs from the session's", () => {
    const s = new MockSource();
    expect(applyUrlParams(s, "?astronaut=hana&scenario=low-spo2")).toBe("hana");
    expect(s.getMission().scenario).toBe("low-spo2");
  });

  it("keeps an entered reading when the same link is reloaded", () => {
    const s = new MockSource();
    applyUrlParams(s, "?astronaut=hana&scenario=normal");
    s.addReading("hana", "temp", { value: 37.9, device: "thermometer" });
    const spy = vi.spyOn(s, "setScenario");
    // The reload: same link, same session.
    applyUrlParams(s, "?astronaut=hana&scenario=normal");
    expect(spy).not.toHaveBeenCalled();
    expect(s.getReadings("hana", "temp", "24h").at(-1)?.value).toBe(37.9);
  });

  it("applies the scenario again when the link names another astronaut", () => {
    const s = new MockSource();
    applyUrlParams(s, "?astronaut=hana&scenario=low-spo2");
    applyUrlParams(s, "?astronaut=tomas&scenario=low-spo2");
    expect(s.getMission().scenarioTarget).toBe("tomas");
  });

  it("ignores an unknown scenario", () => {
    const s = new MockSource();
    const before = s.getMission().scenario;
    applyUrlParams(s, "?scenario=meteor");
    expect(s.getMission().scenario).toBe(before);
  });
});
