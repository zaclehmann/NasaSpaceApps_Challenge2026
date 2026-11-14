// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The five-second answer to "Am I OK?" (ui.md 4.2, 5.2), built in parts so indicator names can be links.
import type { Status } from "@missionvitals/shared";
import { byPriority, type HealthView, type IndicatorState } from "../../data/health";

export interface Summary {
  status: Status;
  /** Text before the indicator names. */
  lead: string;
  /** The indicators the sentence names. */
  names: IndicatorState[];
  /** Text after the names. */
  tail: string;
  watching: IndicatorState[];
  /** The whole sentence as plain text. */
  plain: string;
}

export function joinNames(items: IndicatorState[]): string {
  const names = items.map((i) => i.def.phrase);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function buildSummary(view: HealthView): Summary {
  const all = byPriority(view);
  const warnings = all.filter((i) => i.status === "warning");
  const cautions = all.filter((i) => i.status === "caution");
  const watching = all.filter((i) => i.status === "watch");
  const silent = all.filter((i) => i.status === "nodata" && i.ev.reason === "silent");
  let status: Status = "ok";
  let lead = "You're in range.";
  let names: IndicatorState[] = [];
  let tail = "";
  if (warnings.length === 1) {
    const w = warnings[0];
    const how = w.key === "mood" ? "very low" : w.ev.side === "above" ? "high" : "low";
    const at = w.valueText && w.key !== "mood" ? ` at ${w.valueText} ${w.def.unit}` : "";
    status = "warning";
    lead = "Warning: ";
    names = warnings;
    tail = ` is ${how}${at}. Act now.`;
  } else if (warnings.length > 1) {
    status = "warning";
    lead = `${warnings.length} warnings need you: `;
    names = warnings;
    tail = ". Act now.";
  } else if (cautions.length) {
    status = "caution";
    lead = `${cautions.length} ${cautions.length === 1 ? "caution needs" : "cautions need"} you: `;
    names = cautions;
    tail = ".";
  } else if (silent.length) {
    status = "nodata";
    lead = "No data from ";
    names = silent;
    tail = ". Check the sensor.";
  }
  return { status, lead, names, tail, watching, plain: `${lead}${joinNames(names)}${tail}` };
}
