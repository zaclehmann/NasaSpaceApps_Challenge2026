// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Send report to the flight surgeon (ui.md 5.8). Works through the delayed link, and when the link is down.
// On My Health it opens inside the right panel, as a step with a back link, so the figure and readings stay
// in view. Anywhere else it opens as a sheet. Both use the same form.
import { useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { PART_BY_ID, formatClock, formatDelay, formatDuration, formatMet, missionDay, symptomStatus, type Symptom, type Urgency } from "@missionvitals/shared";
import { useMission, useSource } from "../../data/DataProvider";
import { byPriority, type HealthView } from "../../data/health";
import { useSelection } from "../../state/selection";
import { useUi } from "../../state/ui";
import { IndicatorChart } from "../charts/IndicatorChart";
import { PanelShell, Section } from "../panel/PanelShell";
import { selectionTitle } from "../panel/DetailPanel";
import { actionText } from "../panel/ResponsePlan";
import { BadgeIcon, StatusBadge } from "../status/StatusBadge";
import { Button } from "../ui/Button";
import { TextArea } from "../ui/NumericInput";
import { Scale } from "../ui/Scale";
import { Sheet } from "../ui/Sheet";

const URGENCY: Urgency[] = ["routine", "24h", "urgent"];
export const URGENCY_LABEL: Record<Urgency, string> = { routine: "Routine", "24h": "Within 24 hours", urgent: "Urgent" };

/** One active symptom in words for the flight surgeon. */
function symptomLine(x: Symptom): string {
  const where = PART_BY_ID[x.partId]?.name ?? x.partId;
  const work = x.affectsWork ? ", affects work" : "";
  const note = x.note ? `. "${x.note}"` : "";
  return `${where}: ${x.kind.toLowerCase()}, ${x.severity} of 10, since day ${missionDay(x.startedAt)} ${formatClock(x.startedAt)}${work}${note}`;
}

/** The report's state and parts, shared by the panel step and the sheet. */
function useReport(view: HealthView) {
  const source = useSource();
  const mission = useMission();
  const { setReportOpen, showToast } = useUi();
  const out = byPriority(view).filter((i) => i.status === "caution" || i.status === "warning");
  const symptoms = source.getSymptoms(view.astronaut.id).filter((x) => symptomStatus(x, view.now) !== null);
  const symptomLines = symptoms.map((x) => symptomLine(x));
  const actions = view.alerts.flatMap((a) => a.actions.map((x) => `${formatClock(x.t)} MET ${actionText(x.kind, x.note)}`));
  const [note, setNote] = useState("");
  const anyWarning = out.some((i) => i.status === "warning") || symptoms.some((x) => symptomStatus(x, view.now) === "warning");
  const [urgency, setUrgency] = useState(anyWarning ? 3 : out.length || symptoms.length ? 2 : 1);
  const queue = () => {
    source.queueReport(view.astronaut.id, {
      urgency: URGENCY[urgency - 1],
      note: note.trim(),
      items: out.map((i) => ({ indicator: i.key, status: i.status, valueText: `${i.valueText ?? "No reading"}${i.valueText && i.key !== "mood" ? ` ${i.def.unit}` : ""}` })),
      actions,
      symptoms: symptomLines,
    });
    showToast("Report queued");
    setReportOpen(false);
  };

  const delivery: ReactNode = mission.earthLink.up ? (
    <p className="type-small text-muted-foreground">
      Arrives on Earth in about {formatDelay(mission.earthLink.delaySec)}. A reply takes at least {formatDuration(Math.floor((mission.earthLink.delaySec * 2) / 60) * 60)}.
    </p>
  ) : (
    <p className="flex items-start gap-2 type-small text-caution-text">
      <BadgeIcon status="caution" className="mt-0.5" />
      <span>Earth link down. Your report will send automatically when the link returns.</span>
    </p>
  );

  const footer = (
    <div className="space-y-2.5">
      {delivery}
      <Button variant="primary" className="w-full" onClick={queue}>
        Queue report
      </Button>
    </div>
  );

  const body = (
    <>
      <dl className="mb-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 type-small">
        <dt className="text-muted-foreground">From</dt>
        <dd>
          {view.astronaut.name}, {view.astronaut.role.toLowerCase()}
        </dd>
        <dt className="text-muted-foreground">Time</dt>
        <dd>MET {formatMet(view.now)}</dd>
      </dl>

      <Section title="Out of range">
        {out.length ? (
          <ul className="divide-y divide-border border-y border-border">
            {out.map((i) => (
              <li key={i.key} className="py-2.5">
                <div className="flex items-center justify-between gap-3 type-small">
                  <span className="font-medium">{i.def.name}</span>
                  <span className="font-medium">
                    {i.valueText ?? "No reading"}
                    {i.valueText && i.key !== "mood" ? ` ${i.def.unit}` : ""}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 type-caption">
                  <StatusBadge status={i.status} />
                  <span className="text-subtle-foreground">{i.def.source === "entered" ? "Last 7 days" : "Last 24 hours"}</span>
                </div>
                <IndicatorChart astronautId={view.astronaut.id} indicator={i.key} window={i.def.source === "entered" ? "7d" : "24h"} compact />
              </li>
            ))}
          </ul>
        ) : (
          <p className="type-small text-muted-foreground">No readings are out of range. You can still send a routine report.</p>
        )}
      </Section>

      <Section title="Symptoms">
        {symptoms.length ? (
          <ul className="divide-y divide-border border-y border-border">
            {symptoms.map((x, n) => {
              const st = symptomStatus(x, view.now);
              return (
                <li key={x.id} className="flex items-start justify-between gap-3 py-2.5 type-small">
                  <span>{symptomLines[n]}</span>
                  {st && <StatusBadge status={st} className="shrink-0 type-caption" />}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="type-small text-muted-foreground">No symptoms logged.</p>
        )}
      </Section>

      <Section title="Actions already taken">
        {actions.length ? (
          <ul className="space-y-1 type-small">
            {actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : (
          <p className="type-small text-muted-foreground">None logged yet.</p>
        )}
      </Section>

      <div className="space-y-5">
        <TextArea label="Your note, optional" value={note} onChange={setNote} placeholder="How you feel, and what you have tried." />
        <Scale legend="Urgency" labels={URGENCY.map((u) => URGENCY_LABEL[u])} value={urgency} onChange={setUrgency} />
      </div>
    </>
  );

  return { body, footer };
}

/** The report as a step inside the right panel, with a back link to what was open. */
export function ReportPanel({ view }: { view: HealthView }) {
  const { setReportOpen } = useUi();
  const selection = useSelection(view);
  const { body, footer } = useReport(view);
  return (
    <PanelShell
      title="Report to the flight surgeon"
      back={{ label: selectionTitle(selection), onClick: () => setReportOpen(false) }}
      summary={<p className="type-small text-muted-foreground">Review, add a note, then queue it for downlink.</p>}
      footer={footer}
    >
      {body}
    </PanelShell>
  );
}

function SheetForm({ view }: { view: HealthView }) {
  const { setReportOpen } = useUi();
  const { body, footer } = useReport(view);
  return (
    <Sheet open onOpenChange={setReportOpen} title="Report to the flight surgeon" description="Review, add a note, then queue it for downlink." footer={footer}>
      {body}
    </Sheet>
  );
}

/** The sheet, for pages without a right panel. On My Health the panel hosts the report instead. */
export function ReportSheet({ view }: { view: HealthView }) {
  const { reportOpen } = useUi();
  const { pathname } = useLocation();
  if (!reportOpen || pathname === "/") return null;
  return <SheetForm view={view} />;
}
