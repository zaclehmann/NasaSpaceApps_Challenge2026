// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The explanation panel (ui.md 5.2 right column): items that need attention, then the selected detail.
import { INDICATORS, REGION_BY_ID } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useSelection } from "../../state/selection";
import { useUi, type Selection } from "../../state/ui";
import { BadgeIcon, StatusWord } from "../status/StatusBadge";
import { IndicatorDetail } from "./IndicatorDetail";
import { RegionDetail } from "./RegionDetail";
import { buildSummary } from "./summary";
import type { IndicatorState } from "../../data/health";

export const selectionTitle = (s: Selection) => (s.kind === "indicator" ? INDICATORS[s.key].name : REGION_BY_ID[s.id].name);

function ItemRow({ item }: { item: IndicatorState }) {
  const { select } = useUi();
  return (
    <li>
      <button type="button" onClick={() => select({ kind: "indicator", key: item.key })} className="flex min-h-12 w-full items-center gap-2 py-1.5 text-left type-small hover:bg-muted xl:min-h-10">
        <BadgeIcon status={item.status} />
        <StatusWord status={item.status} />
        <span className="min-w-0 flex-1">{item.def.name}</span>
        {item.valueText && (
          <span className="shrink-0 text-muted-foreground">
            {item.valueText}
            {item.key === "mood" ? "" : ` ${item.def.unit}`}
          </span>
        )}
      </button>
    </li>
  );
}

/** More than one Caution or Warning: a short list. Watch items collapse under "Also watching". */
export function AttentionList({ view }: { view: HealthView }) {
  const s = buildSummary(view);
  if (s.attention.length < 2 && !s.watching.length) return null;
  return (
    <div className="type-small">
      {s.attention.length > 1 && (
        <ul aria-label="Needs attention" className="divide-y divide-border">
          {s.attention.map((i) => (
            <ItemRow key={i.key} item={i} />
          ))}
        </ul>
      )}
      {s.watching.length > 0 && (
        <details>
          <summary className="flex min-h-12 items-center text-muted-foreground hover:text-foreground xl:min-h-9">Also watching ({s.watching.length})</summary>
          <ul className="divide-y divide-border">
            {s.watching.map((i) => (
              <ItemRow key={i.key} item={i} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function DetailBody({ view }: { view: HealthView }) {
  const selection = useSelection(view);
  return selection.kind === "indicator" ? (
    <IndicatorDetail key={`${view.astronaut.id}-${selection.key}`} view={view} indicator={selection.key} />
  ) : (
    <RegionDetail key={selection.id} view={view} region={selection.id} />
  );
}
