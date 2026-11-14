// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The item shown in the panel: the user's choice; by default the worst item, or on a normal day (nothing
// out of range) the next due task (ui.md 5.2).
import { REGION_BY_ID, nextTask, regionsForIndicator, type IndicatorKey, type RegionId } from "@missionvitals/shared";
import { byPriority, type HealthView } from "../data/health";
import { useUi, type Selection } from "./ui";

export function useSelection(view: HealthView): Selection {
  const { selection } = useUi();
  if (selection) return selection;
  const worst = byPriority(view)[0];
  const flagged = worst.status !== "ok" && worst.status !== "due";
  const next = nextTask(view.routine.entries)?.task.kind;
  if (!flagged && next && next in view.indicators) return { kind: "indicator", key: next as IndicatorKey };
  return { kind: "indicator", key: worst.key };
}

/** Regions and indicators to outline, from selection and from linked hover in either direction. */
export function useHighlights(view: HealthView) {
  const { hoverIndicator, hoverRegion } = useUi();
  const selection = useSelection(view);
  const regions = new Set<RegionId>();
  const indicators = new Set<IndicatorKey>();
  if (hoverRegion) {
    regions.add(hoverRegion);
    REGION_BY_ID[hoverRegion].indicators.forEach((k) => indicators.add(k));
  }
  if (hoverIndicator) regionsForIndicator(hoverIndicator).forEach((r) => regions.add(r.id));
  const selectedRegions = new Set<RegionId>();
  if (selection.kind === "region") selectedRegions.add(selection.id);
  return { selection, hoverRegions: regions, hoverIndicators: indicators, selectedRegions };
}
