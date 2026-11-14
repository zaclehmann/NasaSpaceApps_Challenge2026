// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Body region detail (ui.md 5.4) in the shared panel layout.
// Now: your readings and the symptoms logged here. Trend: each reading over time. About: what it does and the spaceflight risk.
import { BODY_PARTS, HRP_RISKS_URL, NOT_MEASURED, REGION_BY_ID, REGION_GUIDANCE, type IndicatorKey, type RegionId, type Status } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { IndicatorChart } from "../charts/IndicatorChart";
import { Sparkline } from "../charts/Sparkline";
import { INDICATOR_ICON } from "../indicators/icons";
import { BadgeIcon, StatusBadge, StatusWord } from "../status/StatusBadge";
import { STATUS_TEXT } from "../status/statusStyles";
import { Button } from "../ui/Button";
import { HazardTags, Sources } from "./IndicatorDetail";
import { PanelShell, Section } from "./PanelShell";

/** Reading rows for a region or a body part: icon, name, status if flagged, trend and value. Each opens its indicator. */
export function ReadingRows({ view, keys }: { view: HealthView; keys: IndicatorKey[] }) {
  const { select } = useUi();
  if (!keys.length) return null;
  return (
    <ul className="mt-1 divide-y divide-border border-y border-border">
      {keys.map((k) => {
        const s = view.indicators[k];
        const Icon = INDICATOR_ICON[k];
        const quiet = s.status === "ok" || s.status === "watch";
        return (
          <li key={k}>
            <button type="button" onClick={() => select({ kind: "indicator", key: k })} className="flex min-h-11 w-full items-center gap-2.5 py-1 text-left type-small hover:bg-muted max-xl:min-h-12">
              <Icon size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{s.def.name}</span>
                {s.status !== "ok" && s.status !== "due" && (
                  <span className="flex items-center gap-1 type-caption">
                    <BadgeIcon status={s.status} size={12} />
                    <StatusWord status={s.status} />
                  </span>
                )}
              </span>
              <Sparkline points={s.spark} def={s.def} status={s.status} now={view.now} />
              <span className={quiet ? "shrink-0 font-semibold" : `shrink-0 font-semibold ${STATUS_TEXT[s.status]}`}>
                {s.valueText ? `${s.valueText}${k === "mood" ? "" : ` ${s.def.unit}`}` : s.status === "due" ? "Due" : s.ev.reason === "silent" ? "No reading" : "Not taken today"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function RegionDetail({ view, region }: { view: HealthView; region: RegionId }) {
  const { select, startSymptom, setReportOpen } = useUi();
  const def = REGION_BY_ID[region];
  const g = REGION_GUIDANCE[region];
  const status = view.regions[region];
  const parts = BODY_PARTS.filter((p) => p.region === region && view.parts[p.id]);
  const flagged = status === "watch" || status === "caution" || status === "warning";
  return (
    <PanelShell
      title={def.name}
      status={status !== null ? <StatusBadge status={status} /> : <span className="text-muted-foreground">{NOT_MEASURED}</span>}
      kicker={def.crewWide ? "Crew-wide" : undefined}
      primary={
        <Button size="sm" onClick={() => startSymptom()}>
          Log symptom
        </Button>
      }
      summary={<p className="max-w-[62ch] type-small text-muted-foreground">{g.whatItDoes}</p>}
      footer={
        flagged ? (
          <Button size="sm" onClick={() => setReportOpen(true)}>
            Send report
          </Button>
        ) : undefined
      }
      tabs={[
        {
          id: "now",
          label: "Now",
          content: (
            <>
              <Section title="Your readings">
                {def.indicators.length ? <ReadingRows view={view} keys={def.indicators} /> : <p className="max-w-[62ch] type-small text-muted-foreground">{NOT_MEASURED}</p>}
                {g.relatedCheck && <p className="mt-2 max-w-[62ch] type-small text-muted-foreground">{g.relatedCheck}</p>}
              </Section>
              <Section title="Symptoms logged here">
                {parts.length ? (
                  <ul className="divide-y divide-border border-y border-border">
                    {parts.map((p) => {
                      const st = view.parts[p.id] as Status;
                      return (
                        <li key={p.id}>
                          <button type="button" onClick={() => select({ kind: "part", id: p.id })} className="flex min-h-11 w-full items-center gap-2.5 py-1 text-left type-small hover:bg-muted max-xl:min-h-12">
                            <BadgeIcon status={st} />
                            <span className="min-w-0 flex-1 font-medium">{p.name}</span>
                            <StatusWord status={st} className="type-caption" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="type-small text-muted-foreground">None active. Tap a part on the figure, or use Log symptom.</p>
                )}
              </Section>
            </>
          ),
        },
        {
          id: "trend",
          label: "Trend",
          content: def.indicators.length ? (
            <>
              {def.indicators.map((k) => {
                const ind = view.indicators[k];
                return (
                  <Section key={k} title={ind.def.name} aside={<span className="type-caption text-subtle-foreground">{ind.def.source === "entered" ? "Last 7 days" : "Last 24 hours"}</span>}>
                    <IndicatorChart astronautId={view.astronaut.id} indicator={k} window={ind.def.source === "entered" ? "7d" : "24h"} alert={view.alerts.find((a) => a.indicator === k)} height={150} />
                  </Section>
                );
              })}
            </>
          ) : (
            <p className="type-small text-muted-foreground">{NOT_MEASURED} Symptoms you log here show in the Symptoms list.</p>
          ),
        },
        {
          id: "about",
          label: "About",
          content: (
            <>
              <Section title="Spaceflight risk">
                <p className="max-w-[62ch] type-small">{g.riskSentence}</p>
                <p className="mt-1.5 type-small">
                  NASA risk:{" "}
                  {def.risks.map((r, i) => (
                    <span key={r}>
                      {i > 0 && "; "}
                      <a className="text-link underline underline-offset-2" href={HRP_RISKS_URL} target="_blank" rel="noreferrer">
                        {r}
                      </a>
                    </span>
                  ))}
                </p>
                <div className="mt-2">
                  <HazardTags hazards={g.hazards} />
                </div>
              </Section>
              <Section title="Keep it healthy">
                <ul className="list-disc space-y-1 pl-5 type-small">
                  {g.keepHealthy.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </Section>
              <Sources sources={[{ label: "NASA HRP: Risks of Human Spaceflight", url: HRP_RISKS_URL }]} lead="Risk names are NASA's Human Research Program's own." />
            </>
          ),
        },
      ]}
    />
  );
}
