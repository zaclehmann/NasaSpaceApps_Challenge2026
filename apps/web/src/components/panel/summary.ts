// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The five-second answer to "Am I OK?" (ui.md 4.2, 5.2), built in parts so indicator names can be links.
import { PART_BY_ID, type Status } from "@missionvitals/shared";
import { byPriority, type HealthView, type IndicatorState } from "../../data/health";
import type { Selection } from "../../state/ui";

/** One thing the sentence names: a reading or a body part with a logged symptom. Each is a link. */
export interface SummaryName {
  id: string;
  phrase: string;
  target: Selection;
}

export interface Summary {
  status: Status;
  /** Text before the names. */
  lead: string;
  /** What the sentence names: readings first, then body parts. */
  names: SummaryName[];
  /** Text after the names. */
  tail: string;
  watching: SummaryName[];
  /** The whole sentence as plain text. */
  plain: string;
}

const fromIndicator = (i: IndicatorState): SummaryName => ({ id: i.key, phrase: i.def.phrase, target: { kind: "indicator", key: i.key } });

/** Parts with an active symptom at this status, as names like "left knee symptom". */
function partNames(view: HealthView, status: Status): SummaryName[] {
  return Object.entries(view.parts)
    .filter(([, st]) => st === status)
    .flatMap(([id]) => {
      const p = PART_BY_ID[id];
      return p ? [{ id, phrase: `${p.name.toLowerCase()} symptom`, target: { kind: "part", id } as Selection }] : [];
    });
}

export function joinNames(items: SummaryName[]): string {
  const names = items.map((i) => i.phrase);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function buildSummary(view: HealthView): Summary {
  const all = byPriority(view);
  const warnInd = all.filter((i) => i.status === "warning");
  const warnings = [...warnInd.map(fromIndicator), ...partNames(view, "warning")];
  const cautions = [...all.filter((i) => i.status === "caution").map(fromIndicator), ...partNames(view, "caution")];
  const watching = [...all.filter((i) => i.status === "watch").map(fromIndicator), ...partNames(view, "watch")];
  const silent = all.filter((i) => i.status === "nodata" && i.ev.reason === "silent").map(fromIndicator);
  let status: Status = "ok";
  let lead = "You're in range.";
  let names: SummaryName[] = [];
  let tail = "";
  if (warnings.length === 1) {
    status = "warning";
    lead = "Warning: ";
    names = warnings;
    const w = warnInd[0];
    if (w) {
      const how = w.key === "mood" ? "very low" : w.ev.side === "above" ? "high" : "low";
      const at = w.valueText && w.key !== "mood" ? ` at ${w.valueText} ${w.def.unit}` : "";
      tail = ` is ${how}${at}. Act now.`;
    } else {
      tail = " needs attention. Act now.";
    }
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
