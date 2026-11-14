// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { describe, expect, it } from "vitest";
import { MISSION_SETTINGS } from "./scenarios";
import { formatDelay } from "./time";

describe("formatDelay", () => {
  it("reads minutes and seconds for Mars", () => expect(formatDelay(408)).toBe("6 min 48 s"));
  it("keeps one decimal for short delays", () => {
    expect(formatDelay(1.3)).toBe("1.3 s");
    expect(formatDelay(0.3)).toBe("0.3 s");
  });
  it("drops a trailing .0", () => expect(formatDelay(2)).toBe("2 s"));
});

describe("mission settings", () => {
  it("lists the four settings with Mars transit first, the default", () => {
    expect(MISSION_SETTINGS.map((m) => m.id)).toEqual(["mars-transit", "station", "lunar", "mars-rover"]);
  });
});
