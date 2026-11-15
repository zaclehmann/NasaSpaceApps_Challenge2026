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
    // Opening the app is one request: /state creates a session it doesn't know yet.
    expect((await route(ctx, "GET", "/api/state", { session: S2 }, undefined)).status).toBe(200);
    // A write to an unknown session is refused.
    const S3 = "33333333-3333-4333-8333-333333333333";
    expect((await route(ctx, "POST", "/api/readings", {}, JSON.stringify({ session: S3, astronaut: "hana", indicator: "temp", value: 36.8, device: "thermometer" }))).status).toBe(404);
    expect((await route(ctx, "GET", "/api/nothing", {}, undefined)).status).toBe(404);
  });

  it("acknowledging sets acknowledged_at, and a later /state still shows it acknowledged", async () => {
    const { ctx, store, advance } = setup();
    await h.createSession(ctx, { id: S1 });
    const r = await h.postReading(ctx, { session: S1, astronaut: "mira", indicator: "bp", value: 150, value2: 95, device: "cuff" });
    const alertId = (r.alert as { id: string }).id;
    advance(30);
    await h.acknowledgeAlert(ctx, alertId, { session: S1 });
    expect(store.alerts.find((a) => a.indicator === "bp")?.acknowledgedAt).toBeTruthy();
    advance(60);
    const s = await h.getState(ctx, { session: S1 });
    expect(view(s).astronauts.mira.alerts.find((a) => a.indicator === "bp")?.acknowledged).toBe(true);
  });

  it("logs an action on the alert and keeps it across reloads", async () => {
    const { ctx, advance } = setup();
    await h.createSession(ctx, { id: S1 });
    const r = await h.postReading(ctx, { session: S1, astronaut: "mira", indicator: "bp", value: 150, value2: 95, device: "cuff" });
    advance(10);
    await h.logAlertAction(ctx, (r.alert as { id: string }).id, { session: S1, kind: "contacted-cmo" });
    advance(10);
    const s = await h.getState(ctx, { session: S1 });
    const a = view(s).astronauts.mira.alerts.find((x) => x.indicator === "bp") as unknown as { actions: { kind: string }[] };
    expect(a.actions.map((x) => x.kind)).toContain("contacted-cmo");
  });

  it("two sessions don't see each other's readings, symptoms or acknowledgements", async () => {
    const { ctx } = setup();
    await h.createSession(ctx, { id: S1 });
    await h.createSession(ctx, { id: S2 });
    const r = await h.postReading(ctx, { session: S1, astronaut: "mira", indicator: "bp", value: 150, value2: 95, device: "cuff" });
    await h.acknowledgeAlert(ctx, (r.alert as { id: string }).id, { session: S1 });
    await h.postSymptom(ctx, { session: S1, astronaut: "hana", partId: "o-head", layer: "organs", kind: "Headache", severity: 4, startedAt: 141 * 86400 + 14 * 3600, affectsWork: false });
    const other = await h.getState(ctx, { session: S2 });
    expect(other.rows.readings).toHaveLength(0);
    expect(other.rows.symptoms).toHaveLength(0);
    expect(other.rows.alerts.filter((a) => a.acknowledgedAt)).toHaveLength(0);
    expect(view(other).astronauts.mira.indicators.bp.status).not.toBe("caution");
    // An alert id from one session can't be acknowledged through another.
    await expect(h.acknowledgeAlert(ctx, (r.alert as { id: string }).id, { session: S2 })).rejects.toMatchObject({ status: 404 });
  });

  it("bad input returns 400 with a plain message", async () => {
    const { ctx } = setup();
    await h.createSession(ctx, { id: S1 });
    const post = (body: unknown) => route(ctx, "POST", "/api/readings", {}, JSON.stringify(body));
    const severity = await route(ctx, "POST", "/api/symptoms", {}, JSON.stringify({ session: S1, astronaut: "hana", partId: "o-head", layer: "organs", kind: "Pain", severity: 11, startedAt: 0, affectsWork: false }));
    expect(severity.status).toBe(400);
    expect((severity.body as { error: string }).error).toMatch(/severity/);
    const noDia = await post({ session: S1, astronaut: "hana", indicator: "bp", value: 120, device: "cuff" });
    expect(noDia.status).toBe(400);
    expect((noDia.body as { error: string }).error).toMatch(/diastolic/);
    expect((await post({ session: S1, astronaut: "zed", indicator: "bp", value: 1, value2: 1, device: "cuff" })).status).toBe(400);
    expect((await route(ctx, "POST", "/api/readings", {}, "{not json")).status).toBe(400);
    expect((await route(ctx, "POST", "/api/readings", {}, "x".repeat(11 * 1024))).status).toBe(413);
  });

  it("/health says db down instead of throwing when the database is unreachable", async () => {
    const { ctx, store } = setup();
    store.down = true;
    expect(await h.health(ctx)).toMatchObject({ ok: true, db: "down" });
    const r = await route(ctx, "GET", "/api/health", {}, undefined);
    expect(r.status).toBe(200);
    // Other calls fail with a generic 500, not the database's message.
    const s = await route(ctx, "GET", "/api/state", { session: S1 }, undefined);
    expect(s.status).toBe(500);
    expect((s.body as { error: string }).error).not.toMatch(/database/);
  });

  it("reset deletes the session and its rows", async () => {
    const { ctx, store } = setup();
    await h.createSession(ctx, { id: S1 });
    await h.postReading(ctx, { session: S1, astronaut: "hana", indicator: "temp", value: 36.8, device: "thermometer" });
    await h.demo(ctx, { session: S1, reset: true });
    expect(store.sessions.has(S1)).toBe(false);
    expect(store.readings).toHaveLength(0);
  });

  it("choosing a scenario clears entered readings and starts the scenario's story", async () => {
    const { ctx } = setup();
    await h.createSession(ctx, { id: S1 });
    await h.postReading(ctx, { session: S1, astronaut: "hana", indicator: "temp", value: 36.8, device: "thermometer" });
    const r = (await h.demo(ctx, { session: S1, scenario: "low-spo2", target: "hana" })) as { state: { rows: { readings: unknown[] }; session: { scenario: string } } };
    expect(r.state.rows.readings).toHaveLength(0);
    expect(r.state.session.scenario).toBe("low-spo2");
  });

  it("keeps the time a reading was taken, clamped to the last 10 minutes and at most 5 s ahead", async () => {
    const { ctx, store } = setup();
    await h.createSession(ctx, { id: S1 });
    const now = Date.parse(ctx.now());
    const post = (takenAt: string) => h.postReading(ctx, { session: S1, astronaut: "hana", indicator: "temp", value: 36.8, device: "thermometer", takenAt });
    await post(new Date(now - 90_000).toISOString());
    await post(new Date(now - 3 * 3600_000).toISOString());
    await post(new Date(now + 60_000).toISOString());
    const t = store.readings.map((r) => Date.parse(r.takenAt) - now);
    expect(t).toEqual([-90_000, -h.ACTION_TIME_PAST_MS, h.ACTION_TIME_FUTURE_MS]);
  });

  it("acknowledges the open alert for the same astronaut and indicator when the id's time differs", async () => {
    const { ctx, store } = setup();
    await h.createSession(ctx, { id: S1 });
    const r = await h.postReading(ctx, { session: S1, astronaut: "mira", indicator: "bp", value: 150, value2: 95, device: "cuff" });
    const id = (r.alert as { id: string }).id.replace(/-(\d+)$/, (_m, n: string) => `-${Number(n) + 5}`);
    await h.acknowledgeAlert(ctx, id, { session: S1 });
    expect(store.alerts.find((a) => a.indicator === "bp")?.acknowledgedAt).toBeTruthy();
  });

  it("refuses impossible values with the form's words and range", async () => {
    const { ctx } = setup();
    await h.createSession(ctx, { id: S1 });
    const post = async (body: Record<string, unknown>) => {
      const r = await route(ctx, "POST", "/api/readings", {}, JSON.stringify({ session: S1, astronaut: "hana", ...body }));
      return { status: r.status, error: (r.body as { error?: string }).error };
    };
    expect(await post({ indicator: "bp", value: 99999, value2: -50, device: "cuff" })).toEqual({ status: 400, error: "value: Systolic must be between 60 and 250 mmHg" });
    expect(await post({ indicator: "bp", value: 120, value2: -50, device: "cuff" })).toEqual({ status: 400, error: "value2: Diastolic must be between 30 and 150 mmHg" });
    expect(await post({ indicator: "bp", value: 120, value2: 130, device: "cuff" })).toEqual({ status: 400, error: "value2: Diastolic must be lower than systolic" });
    expect(await post({ indicator: "temp", value: 1e308, device: "thermometer" })).toEqual({ status: 400, error: "value: Temperature must be between 30 and 43 °C" });
    expect(await post({ indicator: "glucose", value: 5, device: "glucometer" })).toEqual({ status: 400, error: "value: Blood glucose must be between 20 and 600 mg/dL" });
    expect(await post({ indicator: "mood", value: 2.5, device: "self" })).toEqual({ status: 400, error: "value: Mood must be a whole number from 1 to 5" });
    expect((await post({ indicator: "temp", value: 43, device: "thermometer" })).status).toBe(200);
  });
});
