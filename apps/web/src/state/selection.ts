// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The item shown in the panel: the user's choice, or the worst item by default (ui.md 5.2).
import { REGION_BY_ID, regionsForIndicator, type IndicatorKey, type RegionId } from "@missionvitals/shared";
import { byPriority, type HealthView } from "../data/health";
import { useUi, type Selection } from "./ui";

export function useSelection(view: HealthView): Selection {
  const { selection } = useUi();
  return selection ?? { kind: "indicator", key: byPriority(view)[0].key };
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
