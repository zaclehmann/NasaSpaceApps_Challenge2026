// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Chooses the data source before the first render:
// - ?local=1: the in-browser simulator (local mode), for recording the video without the network.
// - Otherwise GET /api/state for this device's session (the server creates it if new). If it answers within the
//   load budget (4 seconds from page load), use the server (HttpSource). If not, the in-browser simulator with
//   "offline" shown and a toast. The request is abandoned at the deadline, so a late answer can't swap the data
//   under the user: the visit stays in local mode.
import { StateResponse } from "@missionvitals/shared";
import { forcedLocal, setConnection } from "./connection";
import type { DataSource } from "./DataSource";
import { HttpSource, api } from "./httpSource";
import { mockSource } from "./mockSource";
import { sessionId } from "./session";

/** From page load to a usable app: the server's state, or local mode. */
export const LOAD_BUDGET_MS = 4000;

/** `budgetMs` is what's left of the load budget; by default the 4 seconds counted from page load. */
export async function pickSource(onDrop: () => void, budgetMs: number = Math.max(500, LOAD_BUDGET_MS - performance.now())): Promise<DataSource> {
  if (forcedLocal()) {
    setConnection("local");
    return mockSource;
  }
  try {
    // One request: /state creates this device's session if it's new, and fails if the database is down.
    const id = sessionId();
    const state = StateResponse.parse(await api(`state?session=${id}`, { timeoutMs: budgetMs }));
    setConnection("server");
    return new HttpSource(id, state, () => {
      setConnection("offline", true);
      onDrop();
    });
  } catch {
    // The toast says so once the app is on screen (ConnectionNotice).
    setConnection("offline", true);
    return mockSource;
  }
}
