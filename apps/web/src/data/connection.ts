// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Where the data comes from, for the header and the fallback notice:
// - "server": the onboard server (the API) is answering; everything the astronaut does is stored.
// - "local": local mode chosen with ?local=1 (for recording the video); the in-browser simulator.
// - "offline": the server didn't answer, so the app switched to the in-browser simulator.
import { useSyncExternalStore } from "react";

export type ConnectionMode = "server" | "local" | "offline";

const listeners = new Set<() => void>();
let mode: ConnectionMode = "local";
/** Set when the server stopped answering during the visit (not at load), so a toast can say so once. */
let droppedAt: number | null = null;

export function setConnection(next: ConnectionMode, dropped = false) {
  mode = next;
  if (dropped) droppedAt = Date.now();
  listeners.forEach((l) => l());
}

export const connectionMode = () => mode;
export const connectionDroppedAt = () => droppedAt;

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useConnection(): { mode: ConnectionMode; droppedAt: number | null } {
  const m = useSyncExternalStore(subscribe, () => mode);
  const d = useSyncExternalStore(subscribe, () => droppedAt);
  return { mode: m, droppedAt: d };
}

/** ?local=1 forces the in-browser simulator. */
export function forcedLocal(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("local") === "1";
  } catch {
    return false;
  }
}
