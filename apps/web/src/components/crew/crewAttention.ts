// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// What needs attention across the crew, worst first, for the crew overview.
// Privacy: mood and symptom details are shown only to the crew medical officer and to the astronaut themselves.
import { PART_BY_ID, STATUS_RANK, formatClock, symptomStatus, type Alert, type Astronaut, type IndicatorKey, type RoutineEntry, type Status, type Symptom } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { actionText } from "../panel/ResponsePlan";
import { taskStatusText } from "../layout/RoutineList";

export interface AttentionItem {
  key: string;
  astronaut: Astronaut;
  status: Status;
  /** What it is: an indicator name, a body part, or "Symptom logged" when the viewer may not see more. */
  item: string;
  indicator?: IndicatorKey;
  value: string;
  since?: number;
  acknowledged: string;
  lastAction: string;
}

/** True when the viewer may see this astronaut's mood and symptom details. */
export const canSeePrivate = (viewer: Astronaut | null, astronaut: Astronaut) => Boolean(viewer && (viewer.isCmo || viewer.id === astronaut.id));

function lastAction(alert: Alert | undefined): string {
  const a = alert?.actions[alert.actions.length - 1];
  return a ? `${actionText(a.kind, a.note).replace(/\.$/, "")}, ${formatClock(a.t)} MET` : "None yet";
}

export function attentionFor(views: HealthView[], symptoms: (id: string) => Symptom[], viewer: Astronaut | null): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const v of views) {
    const open = canSeePrivate(viewer, v.astronaut);
    for (const state of Object.values(v.indicators)) {
      const s = state.status;
      const silent = s === "nodata" && state.ev.reason === "silent";
      if (!(s === "warning" || s === "caution" || s === "watch" || silent)) continue;
      if (state.key === "mood" && !open) continue;
      if (state.key === "radiation" && v !== views[0]) continue; // crew-wide: list it once
      const alert = v.alerts.find((a) => a.indicator === state.key);
      const unit = state.key === "mood" ? "" : ` ${state.def.unit}`;
      items.push({
        key: `${v.astronaut.id}-${state.key}`,
        astronaut: v.astronaut,
        status: s,
        item: state.key === "radiation" ? "Habitat radiation, crew-wide" : state.def.name,
        indicator: state.key,
        value: state.valueText ? `${state.valueText}${unit}` : silent ? "No data" : state.ev.reason === "overdue" ? "Check overdue" : "Not taken",
        since: state.ev.since ?? state.latest?.t,
        acknowledged: alert ? (alert.acknowledged ? `Yes, ${formatClock(alert.acknowledgedAt ?? alert.firedAt)}` : "Not yet") : "No alert",
        lastAction: lastAction(alert),
      });
    }
    for (const sym of symptoms(v.astronaut.id)) {
      const st = symptomStatus(sym, v.now);
      if (!st) continue;
      const part = PART_BY_ID[sym.partId]?.name ?? "Body part";
      items.push({
        key: `${v.astronaut.id}-${sym.id}`,
        astronaut: v.astronaut,
        status: open ? st : "watch",
        item: open ? `${part}: ${sym.kind.toLowerCase()}` : "Symptom logged",
        value: open ? `${sym.severity} of 10` : "Private",
        since: sym.startedAt,
        acknowledged: "No alert",
        lastAction: open && sym.affectsWork ? "Affects work" : "None yet",
      });
    }
  }
  return items.sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status] || (a.since ?? 0) - (b.since ?? 0));
}

/** The routine in words: what is overdue or due, not just a count. */
export function routineWords(entries: RoutineEntry[], now: number): { text: string; overdue: boolean } {
  const overdue = entries.filter((e) => e.state.kind === "overdue");
  if (overdue.length) return { text: overdue.length === 1 ? `${overdue[0].task.label} ${taskStatusText(overdue[0], now).toLowerCase()}` : `${overdue.length} overdue`, overdue: true };
  const due = entries.filter((e) => e.state.kind === "due");
  if (due.length) return { text: due.length === 1 ? `${due[0].task.label} due` : `${due.length} due now`, overdue: false };
  const done = entries.filter((e) => e.state.kind === "done").length;
  return { text: `${done} of ${entries.length} done, none due`, overdue: false };
}
