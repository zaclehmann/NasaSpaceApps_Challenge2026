// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Indicator list (ui.md 5.2): three groups by source, so it is clear what updates itself and what you must measure.
import { INDICATOR_GROUPS, formatClock } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useHighlights } from "../../state/selection";
import { IndicatorRow } from "./IndicatorRow";

export function IndicatorList({ view }: { view: HealthView }) {
  const { selection, hoverIndicators } = useHighlights(view);
  return (
    <section aria-label="Indicators">
      <h2 className="sr-only">Indicators</h2>
      {INDICATOR_GROUPS.map((g) => (
        <div key={g.source}>
          <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-1">
            <h3 className="type-label text-muted-foreground">{g.title}</h3>
            {g.source !== "entered" && <span className="type-caption text-subtle-foreground">{formatClock(view.now)} MET</span>}
          </div>
          <ul>
            {g.keys.map((k) => (
              <IndicatorRow key={k} state={view.indicators[k]} now={view.now} selected={selection.kind === "indicator" && selection.key === k} linked={hoverIndicators.has(k)} acknowledged={view.alerts.some((a) => a.indicator === k && a.acknowledged)} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
