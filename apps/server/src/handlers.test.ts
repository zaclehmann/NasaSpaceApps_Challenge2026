// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Handler tests against the in-memory store: no network, a controllable clock.
import { describe, expect, it } from "vitest";
import * as h from "./handlers";
import { MemoryStore } from "./memoryStore";
import { route } from "./router";

const S1 = "11111111-1111-4111-8111-111111111111";
const S2 = "22222222-2222-4222-8222-222222222222";

function setup() {
  const store = new MemoryStore();
  let wall = Date.parse("2026-11-15T04:00:00.000Z");
  const ctx = { store, now: () => new Date(wall).toISOString() };
  const advance = (sec: number) => {
    wall += sec * 1000;
  };
  return { store, ctx, advance };
}

type View = { astronauts: Record<string, { indicators: Record<string, { status: string }>; alerts: { id: string; indicator: string; acknowledged: boolean }[]; symptoms: unknown[] }> };
const view = (s: { view: unknown }) => s.view as View;

describe("API handlers", () => {
  it("creates a session and returns the screen state", async () => {
    const { ctx } = setup();
    await h.createSession(ctx, { id: S1 });
    const s = await h.getState(ctx, { session: S1, astronaut: "hana" });
    expect(s.session.scenario).toBe("hr-exercise");
    expect(Object.keys(view(s).astronauts)).toEqual(["hana", "mira", "tomas"]);
  });

  it("a high blood pressure reading turns Caution and opens an alert", async () => {
    const { ctx } = setup();
    await h.createSession(ctx, { id: S1 });
    const r = await h.postReading(ctx, { session: S1, astronaut: "mira", indicator: "bp", value: 150, value2: 95, pulse: 70, device: "cuff" });
    expect(r.status).toBe("caution");
    expect(r.alert?.indicator).toBe("bp");
    expect(r.state.rows.alerts.some((a) => a.astronautId === "mira" && a.indicator === "bp")).toBe(true);
  });

  it("answers through the router with status codes", async () => {
    const { ctx } = setup();
    expect((await route(ctx, "GET", "/api/health", {}, undefined)).body).toMatchObject({ ok: true, db: "up" });
    expect((await route(ctx, "POST", "/api/session", {}, JSON.stringify({ id: "nope" }))).status).toBe(400);
    expect((await route(ctx, "GET", "/api/state", { session: S2 }, undefined)).status).toBe(404);
    expect((await route(ctx, "GET", "/api/nothing", {}, undefined)).status).toBe(404);
  });
});
