// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The legend under the figure: all five badges with their words, always shown (ui.md 3.3 rule 5).
import { STATUSES } from "@missionvitals/shared";
import { StatusBadge } from "../status/StatusBadge";

export function BodyLegend() {
  return (
    <ul aria-label="Status legend" className="flex flex-wrap justify-center gap-x-4 gap-y-1 type-caption">
      {STATUSES.map((s) => (
        <li key={s}>
          <StatusBadge status={s} />
        </li>
      ))}
    </ul>
  );
}
