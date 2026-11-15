// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Needs attention: a crewmate's hidden symptom shows its real level, without saying what it is.
import { describe, expect, it } from "vitest";
import { buildHealth } from "../../data/health";
import { MockSource } from "../../data/mockSource";
import { attentionFor } from "./crewAttention";

describe("Needs attention for a crewmate's hidden symptom", () => {
  it("Mira's row for Hana's symptom has the same level as Hana's overall status, and no detail", () => {
    const src = new MockSource();
    // What Mira's browser holds after the server hid Hana's symptom: no body part, symptom, severity or note.
    src.addSymptom("hana", { partId: "", layer: "organs", kind: "", severity: 0, startedAt: src.getMission().met, affectsWork: false, hidden: true, level: "warning" });
    const crew = src.getCrew().map((a) => buildHealth(src, a));
    const mira = src.getCrew().find((a) => a.id === "mira")!;
    const hana = crew.find((v) => v.astronaut.id === "hana")!;
    const row = attentionFor(crew, (id) => src.getSymptoms(id), mira).find((i) => i.astronaut.id === "hana" && i.item === "Symptom logged");
    expect(row).toBeDefined();
    expect(hana.overall).toBe("warning");
    expect(row!.status).toBe(hana.overall);
    expect(row!.value).toBe("Private");
    expect(row!.lastAction).toBe("None yet");
  });
});
