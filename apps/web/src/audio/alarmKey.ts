// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// What the Warning alarm remembers as "already rung": astronaut, indicator, level and the minute the alert opened.
// Not the alert id, which carries the fire time to the second and can differ slightly between the browser's copy
// and the server's, so one alert would otherwise ring twice.
import type { Alert } from "@missionvitals/shared";

export function warningKey(a: Pick<Alert, "astronautId" | "indicator" | "status" | "firedAt">): string {
  return `${a.astronautId}:${a.indicator}:${a.status}:${Math.floor(a.firedAt / 60)}`;
}
