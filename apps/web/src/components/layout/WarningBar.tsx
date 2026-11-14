// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Warning bar (ui.md 5.6): full width under the header, stays until acknowledged. No sound, no flashing.
import { statusLine } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { BadgeIcon } from "../status/StatusBadge";
import { Button } from "../ui/Button";

export function WarningBar({ view }: { view: HealthView }) {
  const { select } = useUi();
  const warnings = view.alerts.filter((a) => a.status === "warning" && !a.acknowledged);
  return (
    <div role="alert" aria-live="assertive">
      {warnings.map((a) => {
        const ind = view.indicators[a.indicator];
        const value = ind.valueText ? ` is ${ind.valueText}${a.indicator === "mood" ? "" : ` ${ind.def.unit}`}` : "";
        return (
          <div key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-warning bg-warning-tint px-4 py-2">
            <BadgeIcon status="warning" />
            <p className="min-w-0 flex-1 type-small text-foreground">
              <span className="font-semibold text-warning-text">Warning</span> {ind.def.name}
              {value}. {statusLine(a.indicator, ind.ev, view.now)} Act now.
            </p>
            <Button size="sm" onClick={() => select({ kind: "indicator", key: a.indicator })}>
              View
            </Button>
          </div>
        );
      })}
    </div>
  );
}
