// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The five-second answer to "Am I OK?" (ui.md 4.2, 5.2).
import { nextTask, type Status } from "@missionvitals/shared";
import { byPriority, type HealthView, type IndicatorState } from "../../data/health";
import { taskStatusText } from "../layout/RoutineBar";

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function joinNames(items: IndicatorState[]): string {
  const names = items.map((i) => i.def.phrase);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export interface Summary {
  sentence: string;
  status: Status;
  attention: IndicatorState[];
  watching: IndicatorState[];
}

export function buildSummary(view: HealthView): Summary {
  const all = byPriority(view);
  const warnings = all.filter((i) => i.status === "warning");
  const cautions = all.filter((i) => i.status === "caution");
  const watching = all.filter((i) => i.status === "watch");
  const silent = all.filter((i) => i.status === "nodata" && i.ev.reason === "silent");
  const attention = [...warnings, ...cautions];
  let sentence: string;
  if (warnings.length === 1) {
    const w = warnings[0];
    const how = w.key === "mood" ? "very low" : w.ev.side === "above" ? "high" : "low";
    sentence = `Warning: ${w.def.phrase} is ${how}. Act now.`;
  } else if (warnings.length > 1) {
    sentence = `${warnings.length} warnings need you: ${joinNames(warnings)}. Act now.`;
  } else if (cautions.length) {
    sentence = `${cautions.length} ${cautions.length === 1 ? "caution needs" : "cautions need"} you: ${joinNames(cautions)}.`;
  } else if (silent.length) {
    sentence = `No data from ${joinNames(silent)}. Check the sensor.`;
  } else {
    const next = nextTask(view.routine.entries);
    const tail = next ? `Next check: ${lower(next.task.label)}, ${lower(taskStatusText(next, view.now))}.` : "Today's checks are done.";
    sentence = `You're in range. ${tail}`;
  }
  const status: Status = warnings.length ? "warning" : cautions.length ? "caution" : silent.length ? "nodata" : "ok";
  return { sentence, status, attention, watching };
}
