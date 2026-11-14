// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Indicator detail (ui.md 5.3). Order: status, number, action, trend, explanation.
import clsx from "clsx";
import { ChevronDown, Lock } from "lucide-react";
import { useState, type ReactNode } from "react";
import { GUIDANCE, formatClock, statusLine, type ChartWindow, type IndicatorKey } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { IndicatorChart } from "../charts/IndicatorChart";
import { INDICATOR_ICON } from "../indicators/icons";
import { StatusBadge } from "../status/StatusBadge";
import { STATUS_TEXT } from "../status/statusStyles";
import { Button } from "../ui/Button";
import { Tabs } from "../ui/Tabs";
import { AlertBlock } from "./AlertBlock";
import { EscalationLevels, type EscalationLevel } from "./EscalationLevels";
import { Steps, WhatToDo } from "./WhatToDo";

export function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="border-t border-border">
      <summary className="flex min-h-12 items-center justify-between gap-3 type-small font-semibold">
        {title}
        <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" className="chev shrink-0 text-muted-foreground transition-transform duration-[120ms]" />
      </summary>
      <div className="pb-4">{children}</div>
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

const SOURCE_LINE = { live: "From your shirt", entered: "Entered by you", habitat: "From the habitat dosimeter" };

export function IndicatorDetail({ view, indicator }: { view: HealthView; indicator: IndicatorKey }) {
  const { startProcedure } = useUi();
  const state = view.indicators[indicator];
  const { def, status, latest, valueText } = state;
  const g = GUIDANCE[indicator];
  const Icon = INDICATOR_ICON[indicator];
  const entered = def.source === "entered";
  const [win, setWin] = useState<ChartWindow>(entered ? "7d" : "1h");
  const alert = view.alerts.find((a) => a.indicator === indicator);
  const level: EscalationLevel =
    status === "warning" ? "surgeon" : status === "caution" && alert?.actions.some((a) => a.kind === "remeasured" || a.kind === "contacted-cmo") ? "cmo" : "self";

  return (
    <article aria-label={def.name} className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 type-section">
            <Icon size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-muted-foreground" />
            {def.name}
          </h2>
          <StatusBadge status={status} className="mt-1 type-small" />
        </div>
        {entered && (
          <Button onClick={() => startProcedure({ kind: indicator, taskId: state.openTask?.task.id })}>{valueText ? "Re-measure" : "Measure"}</Button>
        )}
      </header>

      <div>
        {valueText && latest ? (
          <>
            <p className="flex items-baseline gap-2">
              <span key={valueText} className={clsx("fade-value type-value-xl", status === "ok" ? "text-foreground" : STATUS_TEXT[status])}>
                {valueText}
              </span>
              {indicator !== "mood" && <span className="type-label text-muted-foreground">{def.unit}</span>}
            </p>
            <p className="mt-1 type-caption text-subtle-foreground">
              {SOURCE_LINE[def.source]} at {formatClock(latest.t)} MET
            </p>
          </>
        ) : (
          <p className="type-summary text-nodata-text">No current reading</p>
        )}
        <p className="mt-2 max-w-[62ch] type-body">{statusLine(indicator, state.ev, view.now)}</p>
        {indicator === "mood" && (
          <p className="mt-2 flex items-center gap-1.5 type-caption text-subtle-foreground">
            <Lock size={14} strokeWidth={1.5} aria-hidden="true" />
            Private. Only you and the crew medical officer see this.
          </p>
        )}
      </div>

      {alert && <AlertBlock alert={alert} />}
      <WhatToDo steps={g.whatToDo[status]} />
      <EscalationLevels escalation={g.escalation} current={level} />

      <section>
        <div className="flex items-center justify-between gap-3">
          <h3 className="type-section">Trend</h3>
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
        <IndicatorChart astronautId={view.astronaut.id} indicator={indicator} window={win} alert={alert} />
      </section>

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

      <footer className="type-caption text-subtle-foreground">
        <p>{g.whatItIs} Demo thresholds, simulated data. Not medical advice.</p>
        <p className="mt-1">
          Sources:{" "}
          {g.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a className="text-link underline underline-offset-2" href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            </span>
          ))}
        </p>
      </footer>
    </article>
  );
}
