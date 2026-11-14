// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Body region detail (ui.md 5.4): what it does, your readings, the spaceflight risk and habits.
import { HRP_RISKS_URL, NOT_MEASURED, REGION_BY_ID, REGION_GUIDANCE, type RegionId } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { Sparkline } from "../charts/Sparkline";
import { INDICATOR_ICON } from "../indicators/icons";
import { taskStatusText } from "../layout/RoutineList";
import { BadgeIcon, StatusBadge, StatusWord } from "../status/StatusBadge";
import { STATUS_TEXT } from "../status/statusStyles";
import { Button } from "../ui/Button";
import { HazardTags } from "./IndicatorDetail";

export function RegionDetail({ view, region }: { view: HealthView; region: RegionId }) {
  const { select, startProcedure } = useUi();
  const def = REGION_BY_ID[region];
  const g = REGION_GUIDANCE[region];
  const status = view.regions[region];
  const exercise = region === "musculoskeletal" ? view.routine.entries.find((e) => e.task.kind === "exercise") : undefined;
  return (
    <article aria-label={def.name} className="space-y-4">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h2 className="type-section">{def.name}</h2>
          {status !== null && <StatusBadge status={status} className="type-small" />}
        </div>
        <p className="mt-1.5 max-w-[62ch] type-small">{g.whatItDoes}</p>
        {def.crewWide && <p className="mt-1 type-caption text-subtle-foreground">Crew-wide: the same for everyone on board.</p>}
      </header>

      <section>
        <h3 className="type-small font-semibold">Your readings</h3>
        {def.indicators.length > 0 && (
          <ul className="mt-1 divide-y divide-border border-y border-border">
            {def.indicators.map((k) => {
              const s = view.indicators[k];
              const Icon = INDICATOR_ICON[k];
              const quiet = s.status === "ok" || s.status === "watch";
              return (
                <li key={k}>
                  <button type="button" onClick={() => select({ kind: "indicator", key: k })} className="flex min-h-11 w-full items-center gap-2.5 py-1 text-left type-small hover:bg-muted max-xl:min-h-12">
                    <Icon size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{s.def.name}</span>
                      {s.status !== "ok" && (
                        <span className="flex items-center gap-1 type-caption">
                          <BadgeIcon status={s.status} size={12} />
                          <StatusWord status={s.status} />
                        </span>
                      )}
                    </span>
                    <Sparkline points={s.spark} def={s.def} status={s.status} now={view.now} />
                    <span className={quiet ? "shrink-0 font-semibold" : `shrink-0 font-semibold ${STATUS_TEXT[s.status]}`}>
                      {s.valueText ? `${s.valueText}${k === "mood" ? "" : ` ${s.def.unit}`}` : s.ev.reason === "silent" ? "No reading" : "Not taken today"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {status === null && <p className="mt-1 max-w-[62ch] type-small text-muted-foreground">{NOT_MEASURED}</p>}
        {exercise ? (
          <div className="mt-2 flex items-center justify-between gap-3 type-small">
            <span>
              Exercise log <span className="text-muted-foreground">{taskStatusText(exercise, view.now).toLowerCase()}</span>
            </span>
            {(exercise.state.kind === "due" || exercise.state.kind === "overdue") && (
              <Button size="sm" onClick={() => startProcedure({ kind: "exercise", taskId: exercise.task.id })}>
                Log session
              </Button>
            )}
          </div>
        ) : (
          g.relatedCheck && <p className="mt-2 max-w-[62ch] type-small text-muted-foreground">{g.relatedCheck}</p>
        )}
      </section>

      <section>
        <h3 className="type-small font-semibold">Spaceflight risk</h3>
        <p className="mt-1 max-w-[62ch] type-small">{g.riskSentence}</p>
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
      </section>

      <section>
        <h3 className="type-small font-semibold">Keep it healthy</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 type-small">
          {g.keepHealthy.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-border pt-3 type-caption text-subtle-foreground">Risk names from NASA's Human Research Program. Simulated data. Not medical advice.</footer>
    </article>
  );
}
