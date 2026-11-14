// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Body part detail in the shared panel layout: a named part of the figure (a knee, a rib, a calf).
// Now: active symptoms, what to do, related readings. Trend: symptom history. About: the body system's risk.
// Symptoms are private to the astronaut and the crew medical officer, like mood.
// Guidance is non-diagnostic: rest, re-check, follow mission procedure, contact the crew medical officer.
import { Lock } from "lucide-react";
import { HRP_RISKS_URL, PART_BY_ID, REGION_BY_ID, REGION_GUIDANCE, SYMPTOM_WORDS, formatClock, missionDay, symptomRuleText, symptomStatus, type Status, type Symptom } from "@missionvitals/shared";
import { useSource } from "../../data/DataProvider";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { BadgeIcon, StatusBadge, StatusWord } from "../status/StatusBadge";
import { Button } from "../ui/Button";
import { HazardTags, Sources } from "./IndicatorDetail";
import { PanelShell, Section } from "./PanelShell";
import { ReadingRows } from "./RegionDetail";
import { RelatedItems } from "./RelatedItems";
import { Steps } from "./WhatToDo";

const VIEW_WORD = { organs: "Organ", muscles: "Muscle", skeleton: "Bone" };

const WHAT_TO_DO: Record<"watch" | "caution" | "warning", string[]> = {
  watch: ["Rest the area and avoid what brings it on.", "Check it again tomorrow and update the log."],
  caution: ["Rest the area and avoid what brings it on.", "Tell the crew medical officer today.", "Update the log if it changes."],
  warning: ["Stop the task that affects it.", "Contact the crew medical officer now.", "Follow the mission medical procedure.", "Send a report to the flight surgeon."],
};

const when = (t: number, now: number) => (missionDay(t) === missionDay(now) ? `${formatClock(t)} MET today` : `Day ${missionDay(t)}, ${formatClock(t)} MET`);

function History({ items, now }: { items: Symptom[]; now: number }) {
  return (
    <ol className="relative border-l border-border pl-4">
      {items.map((s) => {
        const st = symptomStatus(s, now);
        return (
          <li key={s.id} className="relative pb-3 last:pb-0">
            <span aria-hidden="true" className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border border-border-strong bg-card" />
            <div className="flex items-baseline justify-between gap-3 type-small">
              <span className="font-medium">{s.kind}</span>
              <span>{s.severity} of 10</span>
            </div>
            <p className="type-caption text-muted-foreground">
              {s.resolvedAt !== undefined ? `Day ${missionDay(s.startedAt)} to day ${missionDay(s.resolvedAt)}` : `Since ${when(s.startedAt, now)}`}
              {s.affectsWork && ", affected work"}
            </p>
            {st && (
              <span className="mt-0.5 flex items-center gap-1 type-caption">
                <BadgeIcon status={st} size={12} />
                <StatusWord status={st} />
              </span>
            )}
            {s.note && <p className="mt-0.5 max-w-[62ch] type-caption text-muted-foreground">{s.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export function PartDetail({ view, partId }: { view: HealthView; partId: string }) {
  const source = useSource();
  const { select, startSymptom, setReportOpen, showToast } = useUi();
  const part = PART_BY_ID[partId];
  if (!part) return <p className="type-small text-muted-foreground">Choose a body part on the figure.</p>;
  const all = source
    .getSymptoms(view.astronaut.id)
    .filter((s) => s.partId === partId)
    .sort((a, b) => b.t - a.t);
  const active = all.filter((s) => s.resolvedAt === undefined);
  const status = view.parts[partId] as Status | undefined;
  const steps = status === "watch" || status === "caution" || status === "warning" ? WHAT_TO_DO[status] : null;
  const region = REGION_BY_ID[part.region];
  const rg = REGION_GUIDANCE[part.region];

  return (
    <PanelShell
      title={part.name}
      back={{ label: region.name, onClick: () => select({ kind: "region", id: part.region }) }}
      status={status ? <StatusBadge status={status} /> : <span className="text-muted-foreground">No active symptom</span>}
      kicker={VIEW_WORD[part.layer]}
      primary={
        <Button variant={active.length ? "secondary" : "primary"} size="sm" onClick={() => startSymptom({ partId })}>
          Log symptom
        </Button>
      }
      summary={
        <p className="flex items-center gap-1.5 type-caption text-subtle-foreground">
          <Lock size={14} strokeWidth={1.5} aria-hidden="true" />
          Private. Only you and the crew medical officer see symptoms.
        </p>
      }
      footer={
        steps ? (
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
              <Section title="Active symptoms">
                {active.length ? (
                  <ul className="divide-y divide-border border-y border-border">
                    {active.map((s) => {
                      const st = symptomStatus(s, view.now);
                      return (
                        <li key={s.id} className="py-2 type-small">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="font-medium">{s.kind}</span>
                            <span className="font-semibold">{s.severity} of 10</span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 type-caption text-muted-foreground">
                            {st && (
                              <span className="flex items-center gap-1">
                                <BadgeIcon status={st} size={12} />
                                <StatusWord status={st} />
                              </span>
                            )}
                            <span>Since {when(s.startedAt, view.now)}</span>
                            {s.affectsWork && <span>Affects work</span>}
                          </div>
                          {s.note && <p className="mt-1 max-w-[62ch] text-muted-foreground">{s.note}</p>}
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <p className="max-w-[62ch] type-caption text-subtle-foreground">{symptomRuleText(s, view.now)}</p>
                            <Button
                              variant="text"
                              size="sm"
                              className="underline"
                              onClick={() => {
                                source.resolveSymptom(s.id);
                                showToast("Symptom marked as gone");
                              }}
                            >
                              Mark as gone
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="type-small text-muted-foreground">Nothing logged for this part. Use Log symptom if something feels wrong here.</p>
                )}
              </Section>
              {steps && (
                <Section title="What to do now">
                  <Steps steps={steps} />
                </Section>
              )}
              {part.indicators.length > 0 && (
                <Section title="Related readings">
                  <ReadingRows view={view} keys={part.indicators} />
                </Section>
              )}
              <RelatedItems view={view} region={part.region} skip={part.indicators} skipPart={partId} />
            </>
          ),
        },
        {
          id: "trend",
          label: "History",
          content: all.length ? <History items={all} now={view.now} /> : <p className="type-small text-muted-foreground">No symptoms logged for this part yet.</p>,
        },
        {
          id: "about",
          label: "About",
          content: (
            <>
              <Section title={`Part of ${region.name.toLowerCase()}`}>
                <p className="max-w-[62ch] type-small">{rg.whatItDoes}</p>
              </Section>
              <Section title="Spaceflight risk">
                <p className="max-w-[62ch] type-small">{rg.riskSentence}</p>
                <p className="mt-1.5 type-small">
                  NASA risk:{" "}
                  {region.risks.map((r, i) => (
                    <span key={r}>
                      {i > 0 && "; "}
                      <a className="text-link underline underline-offset-2" href={HRP_RISKS_URL} target="_blank" rel="noreferrer">
                        {r}
                      </a>
                    </span>
                  ))}
                </p>
                <div className="mt-2">
                  <HazardTags hazards={rg.hazards} />
                </div>
              </Section>
              <Section title="Keep it healthy">
                <ul className="list-disc space-y-1 pl-5 type-small">
                  {rg.keepHealthy.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </Section>
              <Section title="Symptoms you can log here">
                <p className="type-small text-muted-foreground">{SYMPTOM_WORDS[part.layer].join(", ")}.</p>
              </Section>
              <Sources sources={[{ label: "NASA HRP: Risks of Human Spaceflight", url: HRP_RISKS_URL }]} lead="Symptom status follows set rules: severity, how long it has lasted, and whether it limits work." />
            </>
          ),
        },
      ]}
    />
  );
}
