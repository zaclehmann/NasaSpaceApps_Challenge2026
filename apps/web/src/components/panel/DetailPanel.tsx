// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The explanation panel (ui.md 5.2 right column): the detail for the selected indicator or body region.
import { INDICATORS, REGION_BY_ID } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useSelection } from "../../state/selection";
import type { Selection } from "../../state/ui";
import { IndicatorDetail } from "./IndicatorDetail";
import { RegionDetail } from "./RegionDetail";

export const selectionTitle = (s: Selection) => (s.kind === "indicator" ? INDICATORS[s.key].name : REGION_BY_ID[s.id].name);

export function DetailBody({ view }: { view: HealthView }) {
  const selection = useSelection(view);
  return selection.kind === "indicator" ? (
    <IndicatorDetail key={`${view.astronaut.id}-${selection.key}`} view={view} indicator={selection.key} />
  ) : (
    <RegionDetail key={selection.id} view={view} region={selection.id} />
  );
}
