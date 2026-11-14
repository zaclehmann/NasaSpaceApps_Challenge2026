// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Device status, worked out once for every place that shows it (the status bar on tablet and desktop,
// the footer under the figure on phone). Stale data must never look normal, so a silent device says so.
import { formatClock, startOfDay, type DeviceId, type IndicatorKey } from "@missionvitals/shared";
import type { HealthView } from "./health";

export interface DeviceState {
  id: Exclude<DeviceId, "self">;
  name: string;
  /** "live", a clock time, "not used today", "1 sensor silent" or "not reporting". */
  state: string;
  /** True when a device should be reporting and is not. */
  silent: boolean;
  /** The indicator to open when the device is chosen. */
  opens: IndicatorKey;
  /** A one-line description for a tooltip. */
  tip: string;
}

export function deviceStates(view: HealthView): DeviceState[] {
  const i = view.indicators;
  const today = startOfDay(view.now);
  const silentShirt = (["hr", "spo2"] as const).filter((k) => i[k].status === "nodata").length;
  const used = (k: "bp" | "temp" | "glucose") => {
    const r = i[k].latest;
    return r && r.t >= today ? formatClock(r.t) : "not used today";
  };
  const doseSilent = i.radiation.status === "nodata";
  return [
    { id: "shirt", name: "Shirt", state: silentShirt === 0 ? "live" : silentShirt === 2 ? "not reporting" : "1 sensor silent", silent: silentShirt > 0, opens: "hr", tip: "Smart shirt: heart rate, SpO₂ and exercise minutes" },
    { id: "cuff", name: "BP cuff", state: used("bp"), silent: false, opens: "bp", tip: "Blood pressure cuff" },
    { id: "thermometer", name: "Thermometer", state: used("temp"), silent: false, opens: "temp", tip: "Thermometer, for the daily fever check" },
    { id: "glucometer", name: "Glucometer", state: used("glucose"), silent: false, opens: "glucose", tip: "Glucometer" },
    { id: "dosimeter", name: "Dosimeter", state: doseSilent ? "not reporting" : "live", silent: doseSilent, opens: "radiation", tip: "Habitat dosimeter, the same reading for the whole crew" },
  ];
}
