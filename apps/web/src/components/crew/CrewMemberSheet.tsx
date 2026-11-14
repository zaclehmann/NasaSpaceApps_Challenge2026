// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// A crewmate's detail for the crew medical officer: the reading that needs attention, its trend,
// the checklist with what has been done and when, the action log, and any symptoms.
// Read-only: the crewmate works their own checklist on their own screen.
import clsx from "clsx";
import { Check } from "lucide-react";
import { useState } from "react";
import { INDICATOR_KEYS, PART_BY_ID, formatClock, missionDay, statusLine, symptomStatus, whatToDoFor, type ChartWindow, type IndicatorKey } from "@missionvitals/shared";
import { useData } from "../../data/DataProvider";
import type { HealthView } from "../../data/health";
import { IndicatorChart } from "../charts/IndicatorChart";
import { Section } from "../panel/PanelShell";
import { actionText } from "../panel/ResponsePlan";
import { BadgeIcon, StatusBadge, StatusWord } from "../status/StatusBadge";
import { STATUS_TEXT } from "../status/statusStyles";
import { Sheet } from "../ui/Sheet";
import { Tabs } from "../ui/Tabs";

// Worst first: Warning, Caution, Watch, No data. Due and in range keep their usual order after those.
const RANK = { warning: 0, caution: 1, watch: 2, nodata: 3, due: 4, ok: 4 } as const;
const flaggedOrder = (v: HealthView, open: boolean): IndicatorKey[] =>
  INDICATOR_KEYS.filter((k) => open || k !== "mood").sort((a, b) => RANK[v.indicators[a].status] - RANK[v.indicators[b].status]);

/** The sheet opens on the worst reading; with everything in range, on heart rate. */
function defaultKey(v: HealthView, keys: IndicatorKey[]): IndicatorKey {
  const worst = keys[0];
  return worst && RANK[v.indicators[worst].status] < 4 ? worst : "hr";
}

export function CrewMemberSheet({ view, focus, open, onClose, showPrivate }: { view: HealthView | null; focus?: IndicatorKey; open: boolean; onClose: () => void; showPrivate: boolean }) {
  return (
    <Sheet open={open && Boolean(view)} onOpenChange={(o) => !o && onClose()} title={view?.astronaut.name ?? "Crew member"} description={view ? view.astronaut.role : undefined}>
      {view && <Body key={`${view.astronaut.id}-${focus ?? ""}`} view={view} focus={focus} showPrivate={showPrivate} />}
    </Sheet>
  );
}

function Body({ view, focus, showPrivate }: { view: HealthView; focus?: IndicatorKey; showPrivate: boolean }) {
  const { source } = useData();
  const keys = flaggedOrder(view, showPrivate);
  const [key, setKey] = useState<IndicatorKey>(focus && keys.includes(focus) ? focus : defaultKey(view, keys));
  const s = view.indicators[key];
  const entered = s.def.source === "entered";
  const [win, setWin] = useState<ChartWindow>(entered ? "7d" : "1h");
  const alert = view.alerts.find((a) => a.indicator === key);
  const steps = s.status === "ok" || s.status === "due" ? [] : whatToDoFor(key, s.status);
  const doneAt = (step: string) => alert?.actions.find((a) => a.kind === "step" && a.note === step)?.t;
  const log = alert?.actions.filter((a) => a.kind !== "step") ?? [];
  const symptoms = showPrivate ? source.getSymptoms(view.astronaut.id).filter((x) => symptomStatus(x, view.now)) : [];
  const unit = key === "mood" ? "" : ` ${s.def.unit}`;
  // Same rule as the main panel: a value on screen is never paired with "Due" or "Not taken yet".
  const hideBadge = s.soFar || (s.status === "due" && Boolean(s.valueText));
  const line = s.soFar ? "From the shirt. Not confirmed yet." : statusLine(key, s.ev, view.now);

  return (
    <div className="space-y-5 pt-1">
      <div className="flex items-center justify-between gap-3 type-small">
        <span className="text-muted-foreground">Overall</span>
        <StatusBadge status={view.overall} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="crew-indicator" className="type-label text-muted-foreground">
          Reading
        </label>
        <select id="crew-indicator" value={key} onChange={(e) => setKey(e.target.value as IndicatorKey)} className="h-10 rounded-md border border-input bg-card px-2.5 type-small text-foreground max-xl:h-12">
          {keys.map((k) => (
            <option key={k} value={k}>
              {view.indicators[k].def.name}
              {view.indicators[k].status !== "ok" && view.indicators[k].status !== "due" ? `, ${view.indicators[k].status === "nodata" ? "no data" : view.indicators[k].status}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-end justify-between gap-3">
          <p className={clsx("text-[32px] leading-9 font-semibold", s.status === "ok" || s.status === "watch" || s.status === "due" ? "text-foreground" : STATUS_TEXT[s.status])}>
            {s.valueText ? `${s.valueText}` : "No reading"}
            {s.valueText && <span className="ml-1 type-label font-medium text-muted-foreground">{s.soFar ? `${unit} today so far` : unit}</span>}
          </p>
          {!hideBadge && <StatusBadge status={s.status} className="pb-1 type-small" />}
        </div>
        <p className="mt-1 type-small">{line}</p>
        {alert && (
          <p className="mt-1 type-caption text-subtle-foreground">
            {alert.acknowledged ? `Acknowledged ${formatClock(alert.acknowledgedAt ?? alert.firedAt)} MET.` : "Not acknowledged yet."} Alert since {formatClock(alert.firedAt)} MET.
          </p>
        )}
      </div>

      <Section title="Trend">
        <Tabs
          label="Chart period"
          value={win}
          onChange={setWin}
          className="mb-1"
          items={[
            { value: "1h", label: "1 h", disabled: entered },
            { value: "24h", label: "24 h" },
            { value: "7d", label: "7 d" },
            { value: "30d", label: "30 d" },
          ]}
        />
        <IndicatorChart astronautId={view.astronaut.id} indicator={key} window={win} alert={alert} height={170} />
      </Section>

      {steps.length > 0 && (
        <Section title="Checklist">
          <ol className="space-y-1.5">
            {steps.map((step, i) => {
              const at = doneAt(step);
              return (
                <li key={step} className="flex items-start gap-2.5 type-small">
                  <span
                    aria-hidden="true"
                    className={clsx("mt-px flex size-[18px] shrink-0 items-center justify-center rounded-sm border text-[11px] font-medium", at !== undefined ? "border-foreground bg-foreground text-background" : "border-border-strong text-muted-foreground")}
                  >
                    {at !== undefined ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                  </span>
                  <span className={clsx("min-w-0 flex-1", at !== undefined && "text-muted-foreground")}>{step}</span>
                  <span className="shrink-0 type-caption text-subtle-foreground">{at !== undefined ? `Done ${formatClock(at)}` : "Not done"}</span>
                </li>
              );
            })}
          </ol>
        </Section>
      )}

      {alert && (
        <Section title="Action log">
          {log.length ? (
            <ul className="space-y-0.5 type-small">
              {log.map((a, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="shrink-0 text-subtle-foreground">{formatClock(a.t)}</span>
                  <span className="min-w-0">{actionText(a.kind, a.note)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="type-small text-muted-foreground">No actions logged yet.</p>
          )}
        </Section>
      )}

      {showPrivate && (
        <Section title="Symptoms">
          {symptoms.length ? (
            <ul className="divide-y divide-border border-y border-border">
              {symptoms.map((x) => {
                const st = symptomStatus(x, view.now);
                return (
                  <li key={x.id} className="py-2 type-small">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">
                        {PART_BY_ID[x.partId]?.name ?? "Body part"}: {x.kind.toLowerCase()}
                      </span>
                      <span className="font-semibold">{x.severity} of 10</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 type-caption text-muted-foreground">
                      {st && (
                        <span className="flex items-center gap-1">
                          <BadgeIcon status={st} size={12} />
                          <StatusWord status={st} />
                        </span>
                      )}
                      <span>
                        Since day {missionDay(x.startedAt)}, {formatClock(x.startedAt)} MET
                      </span>
                      {x.affectsWork && <span>Affects work</span>}
                    </div>
                    {x.note && <p className="mt-0.5 text-muted-foreground">{x.note}</p>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="type-small text-muted-foreground">None active.</p>
          )}
        </Section>
      )}
    </div>
  );
}
