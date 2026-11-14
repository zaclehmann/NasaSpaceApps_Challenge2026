// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Indicator detail (ui.md 5.3) in the shared panel layout.
// Header: where it belongs, the value, the status and one main action.
// Now: the facts, what to do, when to escalate, related items. Trend: the chart. About: background and sources.
import clsx from "clsx";
import { Lock } from "lucide-react";
import { useState, type ReactNode } from "react";
import { GUIDANCE, formatClock, missionDay, regionsForIndicator, statusLine, type ChartWindow, type IndicatorKey } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { IndicatorChart } from "../charts/IndicatorChart";
import { INDICATOR_ICON } from "../indicators/icons";
import { taskStatusText } from "../layout/RoutineList";
import { StatusBadge } from "../status/StatusBadge";
import { STATUS_TEXT } from "../status/statusStyles";
import { Button } from "../ui/Button";
import { Tabs } from "../ui/Tabs";
import { EscalationLevels, type EscalationLevel } from "./EscalationLevels";
import { PanelShell, Section } from "./PanelShell";
import { RelatedItems } from "./RelatedItems";
import { AcknowledgeButton, ResponseActions, ResponsePlan, alertFor } from "./ResponsePlan";
import { Steps } from "./WhatToDo";

export function HazardTags({ hazards }: { hazards: string[] }) {
  return (
    <ul aria-label="Spaceflight hazards" className="flex flex-wrap gap-1.5">
      {hazards.map((h) => (
        <li key={h} className="rounded-sm bg-muted px-2 py-0.5 type-caption text-muted-foreground">
          {h}
        </li>
      ))}
    </ul>
  );
}

/** A row of facts: label on the left, value on the right, hairline between rows. */
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-border border-y border-border type-small">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-1.5">
          <dt className="shrink-0 text-muted-foreground">{label}</dt>
          <dd className="min-w-0 text-right font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Sources as a caption line of links. */
export function Sources({ sources, lead }: { sources: { label: string; url: string }[]; lead?: string }) {
  return (
    <footer className="border-t border-border pt-3 type-caption text-subtle-foreground">
      {lead && <p className="mb-1">{lead}</p>}
      <p>
        Sources:{" "}
        {sources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && ", "}
            <a className="underline underline-offset-2 hover:text-foreground" href={s.url} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          </span>
        ))}
        . Simulated data. Not medical advice.
      </p>
    </footer>
  );
}

export function IndicatorDetail({ view, indicator }: { view: HealthView; indicator: IndicatorKey }) {
  const { startProcedure, select } = useUi();
  const state = view.indicators[indicator];
  const { def, status, latest, valueText, ev, soFar } = state;
  const g = GUIDANCE[indicator];
  const Icon = INDICATOR_ICON[indicator];
  const entered = def.source === "entered";
  const [win, setWin] = useState<ChartWindow>(entered ? "7d" : "1h");
  const alert = alertFor(view, indicator);
  const region = regionsForIndicator(indicator)[0];
  const level: EscalationLevel[] =
    status === "warning" ? ["cmo", "surgeon"] : status === "caution" && alert?.actions.some((a) => a.kind === "remeasured" || a.kind === "contacted-cmo") ? ["cmo"] : ["self"];
  const unit = indicator === "mood" ? "" : ` ${def.unit}`;
  const measureLabel = indicator === "exercise" ? (soFar ? "Confirm" : "Correct") : valueText ? "Re-measure" : "Measure";

  const facts: [string, ReactNode][] = [["Your range", def.rangeText]];
  if (state.recentRange) facts.push([entered ? "Last 7 days" : "Last hour", `${state.recentRange}${unit}`]);
  if (!entered && ev.since !== undefined && (status === "caution" || status === "warning")) facts.push(["Out of range since", `${formatClock(ev.since)} MET`]);
  if (soFar) facts.push(["Source", `${def.sourceText}. Not confirmed yet`]);
  else if (valueText && latest) facts.push(["Source", `${def.sourceText}, ${formatClock(latest.t)} MET`]);
  else if (latest) facts.push(["Last reading", `Day ${missionDay(latest.t)}, ${formatClock(latest.t)} MET`]);
  else facts.push(["Source", def.sourceText]);

  // One main action: acknowledge an alert first; otherwise measure an entered reading.
  const primary =
    alert && !alert.acknowledged ? (
      <AcknowledgeButton alert={alert} />
    ) : entered ? (
      <Button size="sm" onClick={() => startProcedure({ kind: indicator, taskId: state.openTask?.task.id })}>
        {measureLabel}
      </Button>
    ) : undefined;

  const summary = (
    <>
      {valueText && (latest || soFar) ? (
        <p className="flex items-baseline gap-1.5">
          <span key={valueText} className={clsx("fade-value text-[40px] leading-[44px] font-semibold tracking-[-0.03em]", soFar || status === "ok" || status === "watch" ? "text-foreground" : STATUS_TEXT[status])}>
            {valueText}
          </span>
          {indicator !== "mood" && <span className="type-label text-muted-foreground">{soFar ? `${def.unit} today so far` : def.unit}</span>}
        </p>
      ) : (
        <p className={clsx("type-summary", status === "due" ? "text-muted-foreground" : "text-nodata-text")}>
          {status === "due" ? (state.openTask ? taskStatusText(state.openTask, view.now) : "Due today") : "No current reading"}
        </p>
      )}
      <p className="mt-1 max-w-[62ch] type-small">
        {soFar
          ? `Counted by your shirt so far today. Confirm the day's total${state.openTask && state.openTask.state.kind === "upcoming" ? ` at ${formatClock(state.openTask.dueAt)} MET` : ""}.`
          : statusLine(indicator, ev, view.now)}
      </p>
      {indicator === "mood" && (
        <p className="mt-1 flex items-center gap-1.5 type-caption text-subtle-foreground">
          <Lock size={14} strokeWidth={1.5} aria-hidden="true" />
          Private. Only you and the crew medical officer see this.
        </p>
      )}
    </>
  );

  return (
    <PanelShell
      title={def.name}
      icon={<Icon size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-muted-foreground" />}
      back={region ? { label: region.name, onClick: () => select({ kind: "region", id: region.id }) } : undefined}
      status={<StatusBadge status={status} />}
      kicker={latest && valueText && !soFar ? `${formatClock(latest.t)} MET` : undefined}
      primary={primary}
      summary={summary}
      footer={<ResponseActions view={view} indicator={indicator} />}
      tabs={[
        {
          id: "now",
          label: "Now",
          content: (
            <>
              <Section title="What to do now">
                <ResponsePlan view={view} indicator={indicator} />
              </Section>
              <div className="mb-5">
                <EscalationLevels escalation={g.escalation} current={level} />
              </div>
              <Section title="Facts">
                <Facts rows={facts} />
              </Section>
              {region && <RelatedItems view={view} region={region.id} skip={[indicator]} />}
            </>
          ),
        },
        {
          id: "trend",
          label: "Trend",
          content: (
            <>
              <Tabs
                label="Chart period"
                value={win}
                onChange={setWin}
                className="mb-2"
                items={[
                  { value: "1h", label: "1 h", disabled: entered },
                  { value: "24h", label: "24 h" },
                  { value: "7d", label: "7 d" },
                  { value: "30d", label: "30 d" },
                ]}
              />
              <IndicatorChart astronautId={view.astronaut.id} indicator={indicator} window={win} alert={alert} height={240} />
              <div className="mt-4">
                <Facts rows={facts.filter(([l]) => l !== "Source")} />
              </div>
            </>
          ),
        },
        {
          id: "about",
          label: "About",
          content: (
            <>
              <p className="mb-5 max-w-[62ch] type-small">{g.whatItIs}</p>
              <Section title="Why it changes in space">
                <div className="space-y-2">
                  {g.whySpace.text.map((t) => (
                    <p key={t} className="max-w-[62ch] type-small">
                      {t}
                    </p>
                  ))}
                  <HazardTags hazards={g.whySpace.hazards} />
                  <p className="type-small">
                    NASA risk:{" "}
                    <a className="text-link underline underline-offset-2" href={g.whySpace.riskUrl} target="_blank" rel="noreferrer">
                      {g.whySpace.risk}
                    </a>
                  </p>
                </div>
              </Section>
              <Section title={`How to measure, procedure ${g.howToMeasure.procedureId}`}>
                <p className="mb-2 type-caption text-subtle-foreground">Equipment: {g.howToMeasure.equipment.toLowerCase()}.</p>
                <Steps steps={g.howToMeasure.steps} />
              </Section>
              <Section title="Keep it healthy">
                <ul className="list-disc space-y-1 pl-5 type-small">
                  {g.keepHealthy.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </Section>
              <Sources sources={g.sources} />
            </>
          ),
        },
      ]}
    />
  );
}
