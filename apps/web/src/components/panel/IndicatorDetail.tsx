// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Indicator detail (ui.md 5.3). Order: status, number, action, trend, explanation.
// No card: the panel is a column, and sections are separated by space and hairlines.
import clsx from "clsx";
import { ChevronDown, Lock } from "lucide-react";
import { useState, type ReactNode } from "react";
import { GUIDANCE, formatClock, missionDay, statusLine, type ChartWindow, type IndicatorKey } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { IndicatorChart } from "../charts/IndicatorChart";
import { INDICATOR_ICON } from "../indicators/icons";
import { StatusBadge } from "../status/StatusBadge";
import { STATUS_TEXT } from "../status/statusStyles";
import { Button } from "../ui/Button";
import { Tabs } from "../ui/Tabs";
import { EscalationLevels, type EscalationLevel } from "./EscalationLevels";
import { ResponsePlan } from "./ResponsePlan";
import { Steps } from "./WhatToDo";

export function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="border-t border-border">
      <summary className="flex min-h-10 items-center justify-between gap-3 type-small font-medium max-xl:min-h-12">
        {title}
        <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" className="chev shrink-0 text-muted-foreground transition-transform duration-[120ms]" />
      </summary>
      <div className="pb-3">{children}</div>
    </details>
  );
}

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

const SOURCE_WORD = { live: "Shirt", entered: "Entered by you", habitat: "Habitat dosimeter" };

export function IndicatorDetail({ view, indicator }: { view: HealthView; indicator: IndicatorKey }) {
  const { startProcedure } = useUi();
  const state = view.indicators[indicator];
  const { def, status, latest, valueText, ev } = state;
  const g = GUIDANCE[indicator];
  const Icon = INDICATOR_ICON[indicator];
  const entered = def.source === "entered";
  const [win, setWin] = useState<ChartWindow>(entered ? "7d" : "1h");
  const alert = view.alerts.find((a) => a.indicator === indicator);
  const level: EscalationLevel =
    status === "warning" ? "surgeon" : status === "caution" && alert?.actions.some((a) => a.kind === "remeasured" || a.kind === "contacted-cmo") ? "cmo" : "self";
  const unit = indicator === "mood" ? "" : ` ${def.unit}`;

  const facts: [string, ReactNode][] = [["Demo range", def.rangeText]];
  if (state.recentRange) facts.push([entered ? "Last 7 days" : "Last hour", `${state.recentRange}${unit}`]);
  if (!entered && ev.since !== undefined && (status === "caution" || status === "warning")) facts.push(["Out of range since", `${formatClock(ev.since)} MET`]);
  if (valueText && latest) facts.push(["Source", `${SOURCE_WORD[def.source]}, ${formatClock(latest.t)} MET`]);
  else if (latest) facts.push(["Last reading", `Day ${missionDay(latest.t)}, ${formatClock(latest.t)} MET`]);
  else facts.push(["Source", SOURCE_WORD[def.source]]);

  return (
    <article aria-label={def.name} className="space-y-4">
      <header>
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex min-w-0 items-center gap-2 type-section">
            <Icon size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-muted-foreground" />
            {def.name}
          </h2>
          {entered && (
            <Button size="sm" onClick={() => startProcedure({ kind: indicator, taskId: state.openTask?.task.id })}>
              {valueText ? "Re-measure" : "Measure"}
            </Button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          {valueText && latest ? (
            <p className="flex items-baseline gap-1.5">
              <span key={valueText} className={clsx("fade-value type-value-xl", status === "ok" || status === "watch" ? "text-foreground" : STATUS_TEXT[status])}>
                {valueText}
              </span>
              {indicator !== "mood" && <span className="type-label text-muted-foreground">{def.unit}</span>}
            </p>
          ) : (
            <p className="type-summary text-nodata-text">No current reading</p>
          )}
          <StatusBadge status={status} className="pb-1.5 type-small" />
        </div>
        <p className="mt-1.5 max-w-[62ch] type-small">{statusLine(indicator, ev, view.now)}</p>
        {indicator === "mood" && (
          <p className="mt-1.5 flex items-center gap-1.5 type-caption text-subtle-foreground">
            <Lock size={14} strokeWidth={1.5} aria-hidden="true" />
            Private. Only you and the crew medical officer see this.
          </p>
        )}
      </header>

      <Facts rows={facts} />
      <ResponsePlan view={view} indicator={indicator} />

      <section>
        <div className="flex items-center justify-between gap-3">
          <h3 className="type-small font-semibold">Trend</h3>
          <Tabs
            label="Chart period"
            value={win}
            onChange={setWin}
            items={[
              { value: "1h", label: "1 h", disabled: entered },
              { value: "24h", label: "24 h" },
              { value: "7d", label: "7 d" },
              { value: "30d", label: "30 d" },
            ]}
          />
        </div>
        <IndicatorChart astronautId={view.astronaut.id} indicator={indicator} window={win} alert={alert} height={160} />
      </section>

      <EscalationLevels escalation={g.escalation} current={level} />

      <div>
        <Collapsible title="Why it changes in space">
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
        </Collapsible>
        <Collapsible title="How to measure">
          <p className="mb-2 type-caption text-subtle-foreground">
            Procedure {g.howToMeasure.procedureId}. Equipment: {g.howToMeasure.equipment.toLowerCase()}.
          </p>
          <Steps steps={g.howToMeasure.steps} />
        </Collapsible>
        <Collapsible title="Keep it healthy">
          <ul className="list-disc space-y-1 pl-5 type-small">
            {g.keepHealthy.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </Collapsible>
      </div>

      <footer className="border-t border-border pt-3 type-caption text-subtle-foreground">
        <p>{g.whatItIs} Demo thresholds, simulated data. Not medical advice.</p>
        <p className="mt-1">
          Sources:{" "}
          {g.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a className="underline underline-offset-2 hover:text-foreground" href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            </span>
          ))}
        </p>
      </footer>
    </article>
  );
}
