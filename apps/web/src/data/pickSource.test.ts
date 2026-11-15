// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// pickSource: local mode when the health check fails or is slow, or when ?local=1 asks for it.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SID = "44444444-4444-4444-8444-444444444444";

function stubPage(search: string) {
  vi.stubGlobal("window", { location: { search }, localStorage: { getItem: () => SID, setItem: () => {}, removeItem: () => {} } });
  vi.stubGlobal("document", { hidden: false, addEventListener: () => {}, removeEventListener: () => {} });
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("pickSource", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("honours ?local=1 without calling the API", async () => {
    stubPage("?local=1");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { pickSource } = await import("./pickSource");
    const { mockSource } = await import("./mockSource");
    const { connectionMode } = await import("./connection");
    expect(await pickSource(() => {})).toBe(mockSource);
    expect(connectionMode()).toBe("local");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("uses the in-browser simulator when health fails", async () => {
    stubPage("");
    vi.stubGlobal("fetch", vi.fn(async () => json({ error: "nope" }, 500)));
    const { pickSource } = await import("./pickSource");
    const { mockSource } = await import("./mockSource");
    const { connectionMode } = await import("./connection");
    expect(await pickSource(() => {})).toBe(mockSource);
    expect(connectionMode()).toBe("offline");
  });

  it("uses the in-browser simulator when the database is down", async () => {
    stubPage("");
    vi.stubGlobal("fetch", vi.fn(async () => json({ ok: true, db: "down", time: new Date().toISOString() })));
    const { pickSource } = await import("./pickSource");
    const { mockSource } = await import("./mockSource");
    expect(await pickSource(() => {})).toBe(mockSource);
  });

  it("gives up on a health check that takes longer than 3 seconds", async () => {
    stubPage("");
    // A fetch that only ends when its abort signal fires.
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: { signal?: AbortSignal }) => new Promise((_res, rej) => init?.signal?.addEventListener("abort", () => rej(new DOMException("timeout", "TimeoutError"))))),
    );
    const { pickSource } = await import("./pickSource");
    const { mockSource } = await import("./mockSource");
    const t0 = Date.now();
    expect(await pickSource(() => {})).toBe(mockSource);
    const took = Date.now() - t0;
    expect(took).toBeGreaterThanOrEqual(2900);
    expect(took).toBeLessThan(4500);
  });

  it("uses the server when health, session and state all answer", async () => {
    stubPage("");
    const now = new Date().toISOString();
    const session = { id: SID, createdAt: now, astronautId: null, scenario: "hr-exercise", scenarioTarget: "hana", scenarioStartedAt: now, earthLinkUp: true, sleepPeriod: false, missionSetting: "mars-transit" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/api/health")) return json({ ok: true, db: "up", time: now });
        if (url.endsWith("/api/session")) return json(session);
        return json({ serverTime: now, nowMet: 0, session, rows: { readings: [], symptoms: [], routine: [], alerts: [], actions: [], reports: [] }, view: {} });
      }),
    );
    const { pickSource } = await import("./pickSource");
    const { HttpSource } = await import("./httpSource");
    const { connectionMode } = await import("./connection");
    expect(await pickSource(() => {})).toBeInstanceOf(HttpSource);
    expect(connectionMode()).toBe("server");
  });
});
