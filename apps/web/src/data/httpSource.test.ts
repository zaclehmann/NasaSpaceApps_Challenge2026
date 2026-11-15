// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Actions taken while a save is still in flight (audit bugs A and B). A fake fetch sends every request, after a
// delay, into the real API router with the in-memory store, so browser and server run their real code.
import { StateResponse } from "@missionvitals/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "../../../server/src/memoryStore";
import { route } from "../../../server/src/router";
import { warningKey } from "../audio/alarmKey";
import { HttpSource } from "./httpSource";

const SID = "55555555-5555-4555-8555-555555555555";
const DELAY = 400;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fakeServer() {
  const store = new MemoryStore();
  const ctx = { store, now: () => new Date().toISOString() };
  const fetch = vi.fn(async (url: string, init?: { method?: string; body?: string }) => {
    await sleep(DELAY);
    const u = new URL(url, "http://local");
    const r = await route(ctx, init?.method ?? "GET", u.pathname, Object.fromEntries(u.searchParams), init?.body);
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { "content-type": "application/json" } });
  });
  return { store, ctx, fetch };
}

async function open(server: ReturnType<typeof fakeServer>) {
  await route(server.ctx, "POST", "/api/session", {}, JSON.stringify({ id: SID }));
  const s = await route(server.ctx, "GET", "/api/state", { session: SID }, undefined);
  return new HttpSource(SID, StateResponse.parse(s.body), () => {});
}

describe("httpSource: actions during a save in flight", () => {
  let server: ReturnType<typeof fakeServer>;
  beforeEach(() => {
    server = fakeServer();
    vi.stubGlobal("fetch", server.fetch);
    vi.stubGlobal("document", { hidden: false, addEventListener: () => {}, removeEventListener: () => {} });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("A: log a symptom and mark it as gone at once: it ends resolved, also after the next poll", async () => {
    const src = await open(server);
    const s = src.addSymptom("hana", { partId: "s-knee-l", layer: "skeleton", kind: "Pain", severity: 5, startedAt: src.getMission().met - 600, affectsWork: false });
    src.resolveSymptom(s.id);
    expect(src.getSymptoms("hana").find((x) => x.kind === "Pain" && x.partId === "s-knee-l")?.resolvedAt).toBeDefined();
    await sleep(DELAY * 3 + 300);
    expect(server.store.symptoms).toHaveLength(1);
    expect(server.store.symptoms[0].resolvedAt).toBeTruthy();
    await (src as unknown as { poll: () => Promise<void> }).poll();
    expect(src.getSymptoms("hana").find((x) => x.partId === "s-knee-l")?.resolvedAt).toBeDefined();
  });

  it("B: save a reading and acknowledge its alert at once: it stays acknowledged on the server", async () => {
    const src = await open(server);
    src.addReading("hana", "bp", { value: 172, value2: 104, pulse: 80, device: "cuff" });
    const alert = src.getAlerts("hana").find((a) => a.indicator === "bp");
    expect(alert).toBeDefined();
    src.acknowledgeAlert(alert!.id);
    await sleep(DELAY * 3 + 300);
    const row = server.store.alerts.find((a) => a.indicator === "bp" && a.astronautId === "hana");
    expect(row?.acknowledgedAt).toBeTruthy();
    // The server computes the same alert id as the browser (the reading carries its own time).
    const fresh = StateResponse.parse((await route(server.ctx, "GET", "/api/state", { session: SID }, undefined)).body);
    const serverAlert = (fresh.view.astronauts as Record<string, { alerts: { id: string; indicator: string; acknowledged: boolean }[] }>).hana.alerts.find((a) => a.indicator === "bp");
    expect(serverAlert?.id).toBe(alert!.id);
    expect(serverAlert?.acknowledged).toBe(true);
  });

  it("the Warning alarm key ignores a fire time that differs by seconds, so one alert never rings twice", () => {
    const base = { astronautId: "hana", indicator: "bp" as const, status: "warning" as const };
    const minute = 12234780;
    expect(warningKey({ ...base, firedAt: minute + 19 })).toBe(warningKey({ ...base, firedAt: minute + 24 }));
    expect(warningKey({ ...base, firedAt: minute + 19 })).not.toBe(warningKey({ ...base, status: "caution", firedAt: minute + 19 }));
  });
});
