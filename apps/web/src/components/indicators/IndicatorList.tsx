// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Indicator list (ui.md 5.2): three groups by source, so it is clear what updates itself and what you must measure.
import { INDICATOR_GROUPS } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useHighlights } from "../../state/selection";
import { IndicatorRow } from "./IndicatorRow";

export function IndicatorList({ view, showTitle = true }: { view: HealthView; showTitle?: boolean }) {
  const { selection, hoverIndicators } = useHighlights(view);
  return (
    <section aria-label="Indicators" className="pb-4">
      {showTitle && <h2 className="px-4 pt-4 type-section">Indicators</h2>}
      {INDICATOR_GROUPS.map((g) => (
        <div key={g.source}>
          <h3 className="px-4 pt-4 pb-1 type-label text-muted-foreground">{g.title}</h3>
          <ul>
            {g.keys.map((k) => (
              <IndicatorRow key={k} state={view.indicators[k]} now={view.now} selected={selection.kind === "indicator" && selection.key === k} linked={hoverIndicators.has(k)} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
