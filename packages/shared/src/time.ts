// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Mission elapsed time (MET) helpers. MET is seconds since launch.

export const DAY = 86400;

const pad = (n: number) => String(n).padStart(2, "0");

/** "141d 14:33" */
export function formatMet(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const d = Math.floor(s / DAY);
  const h = Math.floor((s % DAY) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${pad(h)}:${pad(m)}`;
}

/** Time of day on the mission clock, "14:33". */
export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec)) % DAY;
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}`;
}

/** Mission day, counting the launch day as day 1. */
export function missionDay(sec: number): number {
  return Math.floor(sec / DAY) + 1;
}

/** The one mission-time format in the interface: "Mission day 142, 14:33 MET" (day 142 is 141 days elapsed). */
export function formatMissionTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `Mission day ${missionDay(s)}, ${pad(Math.floor((s % DAY) / 3600))}:${pad(Math.floor((s % 3600) / 60))} MET`;
}

/** MET at the start of the mission day that contains `sec`. */
export function startOfDay(sec: number): number {
  return Math.floor(sec / DAY) * DAY;
}

/** "6 min 48 s", "1.3 s", "0.3 s" */
export function formatDelay(sec: number): string {
  if (sec < 10) return `${Number(sec.toFixed(1))} s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}

/** "9 minutes", "1 hour 5 minutes", "12 seconds" */
export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s} second${s === 1 ? "" : "s"}`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"}`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  const hs = `${h} hour${h === 1 ? "" : "s"}`;
  return rm ? `${hs} ${rm} minute${rm === 1 ? "" : "s"}` : hs;
}
