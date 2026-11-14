// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Body region detail (ui.md 5.4).
import { HRP_RISKS_URL, NOT_MEASURED, REGION_BY_ID, REGION_GUIDANCE, type RegionId } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { BadgeIcon, StatusBadge, StatusWord } from "../status/StatusBadge";
import { HazardTags } from "./IndicatorDetail";

export function RegionDetail({ view, region }: { view: HealthView; region: RegionId }) {
  const { select } = useUi();
  const def = REGION_BY_ID[region];
  const g = REGION_GUIDANCE[region];
  const status = view.regions[region];
  return (
    <article aria-label={def.name} className="space-y-5">
      <header>
        <h2 className="type-section">{def.name}</h2>
        {status === null ? <p className="mt-1 type-small text-muted-foreground">{NOT_MEASURED}</p> : <StatusBadge status={status} className="mt-1 type-small" />}
        {def.crewWide && <p className="mt-1 type-caption text-subtle-foreground">Crew-wide: the same for everyone on board.</p>}
      </header>

      <section>
        <h3 className="type-section">What it does</h3>
        <p className="mt-1 max-w-[62ch] type-small">{g.whatItDoes}</p>
      </section>

      <section>
        <h3 className="type-section">Your readings</h3>
        {def.indicators.length ? (
          <ul className="mt-1 divide-y divide-border">
            {def.indicators.map((k) => {
              const s = view.indicators[k];
              return (
                <li key={k}>
                  <button type="button" onClick={() => select({ kind: "indicator", key: k })} className="flex min-h-12 w-full items-center gap-2 py-2 text-left type-small hover:bg-muted">
                    <BadgeIcon status={s.status} />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{s.def.name}</span> <StatusWord status={s.status} className="type-caption" />
                    </span>
                    <span className="shrink-0 font-medium">{s.valueText ? `${s.valueText}${k === "mood" ? "" : ` ${s.def.unit}`}` : "No current reading"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-1 max-w-[62ch] type-small text-muted-foreground">{NOT_MEASURED}</p>
        )}
        {g.relatedCheck && <p className="mt-2 max-w-[62ch] type-small text-muted-foreground">{g.relatedCheck}</p>}
      </section>

      <section>
        <h3 className="type-section">Spaceflight risk</h3>
        <ul className="mt-1 type-small">
          {def.risks.map((r) => (
            <li key={r}>
              <a className="text-link underline underline-offset-2" href={HRP_RISKS_URL} target="_blank" rel="noreferrer">
                {r}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 mb-2 max-w-[62ch] type-small">{g.riskSentence}</p>
        <HazardTags hazards={g.hazards} />
      </section>

      <section>
        <h3 className="type-section">Keep it healthy</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 type-small">
          {g.keepHealthy.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </section>

      <footer className="type-caption text-subtle-foreground">Risk names from NASA's Human Research Program. Simulated data. Not medical advice.</footer>
    </article>
  );
}
