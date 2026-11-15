// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Chooses the data source before the first render:
// - ?local=1: the in-browser simulator (local mode), for recording the video without the network.
// - Otherwise GET /api/state for this device's session (the server creates it if new). If it answers in time, use
//   the server (HttpSource). If not, the in-browser simulator, with "offline" shown.
import { StateResponse } from "@missionvitals/shared";
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
    // One request: /state creates this device's session if it's new, and fails if the database is down.
    const id = sessionId();
    const state = StateResponse.parse(await api(`state?session=${id}`, { timeoutMs: HEALTH_TIMEOUT_MS }));
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
