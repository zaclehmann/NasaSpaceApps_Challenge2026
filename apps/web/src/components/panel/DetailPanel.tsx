// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The explanation panel (ui.md 5.2 right column): the detail for the selected indicator, body region or body part.
import { INDICATORS, PART_BY_ID, REGION_BY_ID } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useSelection } from "../../state/selection";
import type { Selection } from "../../state/ui";
import { IndicatorDetail } from "./IndicatorDetail";
import { PartDetail } from "./PartDetail";
import { RegionDetail } from "./RegionDetail";

export const selectionTitle = (s: Selection) => (s.kind === "indicator" ? INDICATORS[s.key].name : s.kind === "part" ? (PART_BY_ID[s.id]?.name ?? "Body part") : REGION_BY_ID[s.id].name);

export function DetailBody({ view }: { view: HealthView }) {
  const selection = useSelection(view);
  if (selection.kind === "indicator") return <IndicatorDetail key={`${view.astronaut.id}-${selection.key}`} view={view} indicator={selection.key} />;
  if (selection.kind === "part") return <PartDetail key={selection.id} view={view} partId={selection.id} />;
  return <RegionDetail key={selection.id} view={view} region={selection.id} />;
}
