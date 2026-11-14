// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Send report to the flight surgeon (ui.md 5.8). Works through the delayed link, and when the link is down.
import { useState } from "react";
import { formatClock, formatDelay, formatDuration, formatMet, type Urgency } from "@missionvitals/shared";
import { useMission, useSource } from "../../data/DataProvider";
import { byPriority, type HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { IndicatorChart } from "../charts/IndicatorChart";
import { actionText } from "../panel/ResponsePlan";
import { BadgeIcon, StatusBadge } from "../status/StatusBadge";
import { Button } from "../ui/Button";
import { TextArea } from "../ui/NumericInput";
import { Scale } from "../ui/Scale";
import { Sheet } from "../ui/Sheet";

const URGENCY: Urgency[] = ["routine", "24h", "urgent"];
export const URGENCY_LABEL: Record<Urgency, string> = { routine: "Routine", "24h": "Within 24 hours", urgent: "Urgent" };

function Form({ view }: { view: HealthView }) {
  const source = useSource();
  const mission = useMission();
  const { setReportOpen, showToast } = useUi();
  const out = byPriority(view).filter((i) => i.status === "caution" || i.status === "warning");
  const actions = view.alerts.flatMap((a) => a.actions.map((x) => `${formatClock(x.t)} MET ${actionText(x.kind, x.note)}`));
  const [note, setNote] = useState("");
  const [urgency, setUrgency] = useState(out.some((i) => i.status === "warning") ? 3 : out.length ? 2 : 1);
  const up = mission.earthLink.up;
  const queue = () => {
    source.queueReport(view.astronaut.id, {
      urgency: URGENCY[urgency - 1],
      note: note.trim(),
      items: out.map((i) => ({ indicator: i.key, status: i.status, valueText: `${i.valueText ?? "No reading"}${i.valueText && i.key !== "mood" ? ` ${i.def.unit}` : ""}` })),
      actions,
    });
    showToast("Report queued");
    setReportOpen(false);
  };
  return (
    <Sheet
      open
      onOpenChange={setReportOpen}
      title="Report to the flight surgeon"
      description="Review, add a note, then queue it for downlink."
      footer={
        <div className="space-y-3">
          {up ? (
            <p className="type-small text-muted-foreground">
              Arrives on Earth in about {formatDelay(mission.earthLink.delaySec)}. A reply takes at least {formatDuration(Math.floor((mission.earthLink.delaySec * 2) / 60) * 60)}.
            </p>
          ) : (
            <p className="flex items-start gap-2 type-small text-caution-text">
              <BadgeIcon status="caution" className="mt-0.5" />
              <span>Earth link down. Your report will send automatically when the link returns.</span>
            </p>
          )}
          <Button variant="primary" className="w-full" onClick={queue}>
            Queue report
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 type-small">
          <dt className="text-muted-foreground">From</dt>
          <dd>
            {view.astronaut.name}, {view.astronaut.role.toLowerCase()}
          </dd>
          <dt className="text-muted-foreground">Time</dt>
          <dd>MET {formatMet(view.now)}</dd>
        </dl>

        <section>
          <h3 className="type-small font-semibold">Out of range</h3>
          {out.length ? (
            <ul className="mt-1 divide-y divide-border">
              {out.map((i) => (
                <li key={i.key} className="py-3">
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
            <p className="mt-1 type-small text-muted-foreground">No indicators are out of range. You can still send a routine report.</p>
          )}
        </section>

        <section>
          <h3 className="type-small font-semibold">Actions already taken</h3>
          {actions.length ? (
            <ul className="mt-1 space-y-1 type-small">
              {actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 type-small text-muted-foreground">None logged yet.</p>
          )}
        </section>

        <TextArea label="Your note, optional" value={note} onChange={setNote} placeholder="How you feel, and what you have tried." />
        <Scale legend="Urgency" labels={URGENCY.map((u) => URGENCY_LABEL[u])} value={urgency} onChange={setUrgency} />
      </div>
    </Sheet>
  );
}

export function ReportSheet({ view }: { view: HealthView }) {
  const { reportOpen } = useUi();
  return reportOpen ? <Form view={view} /> : null;
}
