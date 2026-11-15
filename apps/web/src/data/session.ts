// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// This browser's demo session id: made on first load, kept on this device. Every row on the server carries it,
// so one judge's actions never change another judge's screen. Reset demo makes a new one.
const KEY = "missionvitals.session";

function fresh(): string {
  return crypto.randomUUID();
}

export function sessionId(): string {
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
    const id = fresh();
    window.localStorage.setItem(KEY, id);
    return id;
  } catch {
    // Storage blocked: a session for this page view only.
    return (memo ??= fresh());
  }
}
let memo: string | undefined;

/** Forget this device's session; the next load starts a new one. */
export function clearSessionId() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    memo = undefined;
  }
}
