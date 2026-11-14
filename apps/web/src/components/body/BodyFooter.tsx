// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Under the figure: the status legend (always shown, ui.md 3.3 rule 5) and one line of device status.
// Stale data must never look normal, so a silent device is named here.
import clsx from "clsx";
import { STATUSES, formatClock, startOfDay } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { DEVICE_ICON } from "../indicators/icons";
import { StatusBadge } from "../status/StatusBadge";

export function BodyFooter({ view }: { view: HealthView }) {
  const i = view.indicators;
  const silent = (["hr", "spo2", "temp"] as const).filter((k) => i[k].status === "nodata").length;
  const today = startOfDay(view.now);
  const entered = (k: "bp" | "glucose") => {
    const r = i[k].latest;
    return r && r.t >= today ? formatClock(r.t) : "not used today";
  };
  const devices = [
    { id: "shirt" as const, text: silent === 0 ? "Shirt connected" : silent === 3 ? "Shirt not reporting" : `Shirt, ${silent} sensors not reporting`, bad: silent > 0 },
    { id: "cuff" as const, text: `BP cuff ${entered("bp")}`, bad: false },
    { id: "glucometer" as const, text: `Glucometer ${entered("glucose")}`, bad: false },
    { id: "dosimeter" as const, text: i.radiation.status === "nodata" ? "Dosimeter not reporting" : "Dosimeter connected", bad: i.radiation.status === "nodata" },
  ];
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
              <li key={d.id} className={clsx("flex items-center gap-1.5", d.bad ? "font-medium text-nodata-text" : "text-subtle-foreground")}>
                <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
                {d.text}
              </li>
            );
          })}
        </ul>
        <span className="ml-auto text-subtle-foreground">Simulated data, demo thresholds</span>
      </div>
    </div>
  );
}
