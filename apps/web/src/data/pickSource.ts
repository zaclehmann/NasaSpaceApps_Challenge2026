// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Chooses the data source before the first render:
// - ?local=1: the in-browser simulator (local mode), for recording the video without the network.
// - Otherwise GET /api/health with a 3-second timeout. If the onboard server and its database answer, open this
//   device's session and use the server (HttpSource). If not, the in-browser simulator, with "offline" shown.
import { HealthResponse, StateResponse } from "@missionvitals/shared";
import { forcedLocal, setConnection } from "./connection";
import type { DataSource } from "./DataSource";
import { HttpSource, api } from "./httpSource";
import { mockSource } from "./mockSource";
import { sessionId } from "./session";

const HEALTH_TIMEOUT_MS = 3000;

export async function pickSource(onDrop: () => void): Promise<DataSource> {
  if (forcedLocal()) {
    setConnection("local");
    return mockSource;
  }
  try {
    const health = HealthResponse.parse(await api("health", { timeoutMs: HEALTH_TIMEOUT_MS }));
    if (!health.ok || health.db !== "up") throw new Error("database down");
    const id = sessionId();
    await api("session", { method: "POST", body: { id } });
    const state = StateResponse.parse(await api(`state?session=${id}`));
    setConnection("server");
    return new HttpSource(id, state, () => {
      setConnection("offline", true);
      onDrop();
    });
  } catch {
    setConnection("offline");
    return mockSource;
  }
}
