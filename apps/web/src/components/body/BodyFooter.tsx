// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Under the figure: the status legend (always shown, ui.md 3.3 rule 5) and one line of device status.
// Device wording comes from data/devices.ts, shared with the status bar.
import clsx from "clsx";
import { STATUSES } from "@missionvitals/shared";
import { deviceStates } from "../../data/devices";
import type { HealthView } from "../../data/health";
import { DEVICE_ICON } from "../indicators/icons";
import { StatusBadge } from "../status/StatusBadge";

export function BodyFooter({ view }: { view: HealthView }) {
  const devices = deviceStates(view);
  return (
    <div className="space-y-1.5 border-t border-border px-4 py-3 type-caption">
      <ul aria-label="Status legend" className="flex flex-wrap gap-x-4 gap-y-1">
        {STATUSES.map((s) => (
          <li key={s}>
            <StatusBadge status={s} />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <ul aria-label="Devices" className="flex flex-wrap gap-x-4 gap-y-1">
          {devices.map((d) => {
            const Icon = DEVICE_ICON[d.id];
            return (
              <li key={d.id} className={clsx("flex items-center gap-1.5", d.silent ? "font-medium text-nodata-text" : "text-subtle-foreground")} title={d.tip}>
                <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
                {d.name} {d.state}
              </li>
            );
          })}
        </ul>
        <span className="ml-auto text-subtle-foreground">Simulated data, demo thresholds</span>
      </div>
    </div>
  );
}
