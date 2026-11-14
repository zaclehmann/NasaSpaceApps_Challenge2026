// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// One status line for devices under the figure (ui.md 0, 4.7). Stale data must never look normal.
import clsx from "clsx";
import { formatClock, startOfDay } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { DEVICE_ICON } from "../indicators/icons";

export function DeviceLine({ view }: { view: HealthView }) {
  const i = view.indicators;
  const silent = (["hr", "spo2", "temp"] as const).filter((k) => i[k].status === "nodata").length;
  const today = startOfDay(view.now);
  const entered = (k: "bp" | "glucose") => (i[k].latest && i[k].latest.t >= today ? formatClock(i[k].latest.t) : "not used today");
  const items = [
    { id: "shirt" as const, text: silent === 0 ? "Shirt connected" : silent === 3 ? "Shirt not reporting" : `Shirt: ${silent} sensors not reporting`, bad: silent > 0 },
    { id: "cuff" as const, text: `BP cuff ${entered("bp")}`, bad: false },
    { id: "glucometer" as const, text: `Glucometer ${entered("glucose")}`, bad: false },
    { id: "dosimeter" as const, text: i.radiation.status === "nodata" ? "Dosimeter not reporting" : "Dosimeter connected", bad: i.radiation.status === "nodata" },
  ];
  return (
    <ul aria-label="Devices" className="flex flex-wrap justify-center gap-x-4 gap-y-1 type-caption">
      {items.map((d) => {
        const Icon = DEVICE_ICON[d.id];
        return (
          <li key={d.id} className={clsx("flex items-center gap-1.5", d.bad ? "font-medium text-nodata-text" : "text-subtle-foreground")}>
            <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
            {d.text}
          </li>
        );
      })}
    </ul>
  );
}
