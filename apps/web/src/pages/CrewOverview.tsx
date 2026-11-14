// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Crew overview for the commander and crew medical officer (ui.md 5.9).
// "Needs attention" first, worst first. The crew medical officer can open any crewmate's detail.
// Privacy: mood and symptom details are shown only to the crew medical officer and the astronaut themselves.
import clsx from "clsx";
import { Lock } from "lucide-react";
import { useState } from "react";
import { INDICATORS, PART_BY_ID, formatClock, formatMet, symptomStatus, type IndicatorKey } from "@missionvitals/shared";
import { CrewMemberSheet } from "../components/crew/CrewMemberSheet";
import { attentionFor, canSeePrivate, routineWords } from "../components/crew/crewAttention";
import { useSwitchAstronaut } from "../components/layout/Sidebar";
import { Button } from "../components/ui/Button";
import { IndicatorChart } from "../components/charts/IndicatorChart";
import { AppShell } from "../components/layout/AppShell";
import { URGENCY_LABEL } from "../components/report/ReportSheet";
import { Facts } from "../components/panel/IndicatorDetail";
import { BadgeIcon, StatusBadge, StatusWord } from "../components/status/StatusBadge";
import { STATUS_TEXT } from "../components/status/statusStyles";
import { useAstronaut, useCrew, useCrewHealth, useData, useMission } from "../data/DataProvider";
import type { HealthView } from "../data/health";

const COLUMNS: IndicatorKey[] = ["hr", "spo2", "bp", "temp", "sleep", "exercise", "mood"];

function Cell({ view, k, canSeeMood }: { view: HealthView; k: IndicatorKey; canSeeMood: boolean }) {
  const s = view.indicators[k];
  if (k === "mood" && !canSeeMood) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Lock size={14} strokeWidth={1.5} aria-hidden="true" />
        Private
      </span>
    );
  }
  if (!s.valueText) return <span className="text-muted-foreground">{s.status === "due" ? "Due" : s.ev.reason === "silent" ? "No data" : "Not taken"}</span>;
  const quiet = s.status === "ok";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {!quiet && <BadgeIcon status={s.status} size={12} />}
      <span className={quiet || s.status === "watch" ? "font-medium" : `font-medium ${STATUS_TEXT[s.status]}`}>
        {s.valueText}
        {k === "mood" ? "" : ` ${s.def.unit}`}
      </span>
      {!quiet && <StatusWord status={s.status} className="type-caption" />}
    </span>
  );
}

function Content() {
  const crew = useCrewHealth();
  const people = useCrew();
  const viewer = useAstronaut();
  const mission = useMission();
  const { source } = useData();
  const queue = source.getDownlinkQueue();
  const name = (id: string) => people.find((p) => p.id === id)?.name ?? id;
  const canSee = (v: HealthView) => canSeePrivate(viewer, v.astronaut);
  // The CMO can open anyone; others can open only themselves.
  const canOpen = (v: HealthView) => Boolean(viewer && (viewer.isCmo || viewer.id === v.astronaut.id));
  const [opened, setOpened] = useState<{ id: string; focus?: IndicatorKey } | null>(null);
  const openedView = opened ? (crew.find((v) => v.astronaut.id === opened.id) ?? null) : null;
  const attention = attentionFor(crew, (id) => source.getSymptoms(id), viewer);
  const switchAstronaut = useSwitchAstronaut();
  const symptomText = (v: HealthView) => {
    const active = source.getSymptoms(v.astronaut.id).filter((x) => symptomStatus(x, v.now));
    if (!active.length) return <span className="text-subtle-foreground">None</span>;
    if (!canSee(v)) return <span className="font-medium">Symptom logged</span>;
    const first = active[0];
    return (
      <span className="font-medium">
        {PART_BY_ID[first.partId]?.name ?? "Body part"}, {first.kind.toLowerCase()} {first.severity}/10
        {active.length > 1 && <span className="font-normal text-muted-foreground"> and {active.length - 1} more</span>}
      </span>
    );
  };
  const routineCell = (v: HealthView) => {
    const r = routineWords(v.routine.entries, v.now);
    return (
      <span className={clsx("inline-flex items-center gap-1.5", r.overdue ? "text-watch-text" : "")}>
        {r.overdue && <BadgeIcon status="watch" size={12} />}
        {r.text}
      </span>
    );
  };
  const nameCell = (v: HealthView, big = false) =>
    canOpen(v) ? (
      <button type="button" onClick={() => setOpened({ id: v.astronaut.id })} className={clsx("relative text-left underline decoration-border-strong underline-offset-4 hover:decoration-foreground", big ? "type-section" : "font-semibold")}>
        {v.astronaut.name}
      </button>
    ) : (
      <span className={big ? "type-section" : "font-semibold"}>{v.astronaut.name}</span>
    );
  const done = crew.reduce((n, v) => n + v.routine.done, 0);
  const total = crew.reduce((n, v) => n + v.routine.total, 0);
  const rad = crew[0].indicators.radiation;
  const radReadings = source.getReadings(crew[0].astronaut.id, "radiation", "30d");
  const meanRate = radReadings.length ? radReadings.reduce((a, r) => a + r.value, 0) / radReadings.length : 0;
  const missionTotal = (meanRate * (mission.met / 3600)) / 1000;

  return (
    <main className="mx-auto w-full max-w-[1240px] min-w-0 flex-1 space-y-8 px-4 py-6 md:px-6">
      <div>
        <h1 className="type-title">Crew overview</h1>
        <p className="mt-1 type-small text-muted-foreground">
          Values at MET {formatMet(mission.met)}.{" "}
          {viewer
            ? viewer.isCmo
              ? "You are the crew medical officer: mood and symptoms are shown, and you can open any crewmate."
              : "Mood and symptom details are private to each astronaut and the crew medical officer."
            : null}
        </p>
        {!viewer && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="type-small font-medium">Choose who you are to see private details.</p>
            <Button size="sm" onClick={switchAstronaut}>
              Choose
            </Button>
          </div>
        )}
      </div>

      <section aria-labelledby="needs-attention">
        <h2 id="needs-attention" className="type-section">
          Needs attention
        </h2>
        {attention.length ? (
          <>
            <div className="mt-2 overflow-x-auto max-lg:hidden">
              <table className="w-full type-small">
                <thead className="bg-muted type-label text-muted-foreground">
                  <tr>
                    {["Status", "Crew member", "What", "Value", "Since", "Acknowledged", "Last action"].map((h) => (
                      <th key={h} scope="col" className="px-2.5 py-2 text-left font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attention.map((a) => {
                    const v = crew.find((x) => x.astronaut.id === a.astronaut.id)!;
                    return (
                      <tr key={a.key} className="h-11">
                        <td className="px-2.5 py-1.5 whitespace-nowrap">
                          <StatusBadge status={a.status} />
                        </td>
                        <th scope="row" className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">
                          {canOpen(v) ? (
                            <button type="button" onClick={() => setOpened({ id: v.astronaut.id, focus: a.indicator })} className="underline decoration-border-strong underline-offset-4 hover:decoration-foreground">
                              {a.astronaut.name}
                            </button>
                          ) : (
                            a.astronaut.name
                          )}
                        </th>
                        <td className="px-2.5 py-1.5">{a.item}</td>
                        <td className={clsx("px-2.5 py-1.5 font-medium whitespace-nowrap", a.status === "warning" || a.status === "caution" ? STATUS_TEXT[a.status] : "")}>{a.value}</td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap text-muted-foreground">{a.since !== undefined ? `${formatClock(a.since)} MET` : ""}</td>
                        <td className={clsx("px-2.5 py-1.5 whitespace-nowrap", a.acknowledged === "Not yet" ? "font-medium" : "text-muted-foreground")}>{a.acknowledged}</td>
                        <td className="px-2.5 py-1.5 text-muted-foreground">{a.lastAction}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ul className="mt-2 divide-y divide-border border-y border-border lg:hidden">
              {attention.map((a) => (
                <li key={a.key} className="py-2.5 type-small">
                  <div className="flex flex-wrap items-center justify-between gap-x-3">
                    <span className="font-semibold">{a.astronaut.name}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <p>
                    {a.item}, <span className="font-medium">{a.value}</span>
                    {a.since !== undefined && <span className="text-muted-foreground">, since {formatClock(a.since)} MET</span>}
                  </p>
                  <p className="type-caption text-muted-foreground">
                    Acknowledged: {a.acknowledged}. Last action: {a.lastAction}.
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-1 type-small text-muted-foreground">Nothing needs attention. Every reading is in range and no symptoms are logged.</p>
        )}
      </section>

      <section aria-label="Crew status">
        <div className="overflow-x-auto max-xl:hidden">
          <table className="w-full type-small">
            <thead className="bg-muted type-label text-muted-foreground">
              <tr>
                {["Name", "Overall", ...COLUMNS.map((k) => INDICATORS[k].name), "Symptoms", "Routine today", "Last check-in"].map((h) => (
                  <th key={h} scope="col" className="px-2.5 py-2.5 text-left font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {crew.map((v) => (
                <tr key={v.astronaut.id} className="h-12 align-middle">
                  <th scope="row" className="px-2.5 py-2 text-left whitespace-nowrap">
                    {nameCell(v)}
                    <span className="block type-caption font-normal text-muted-foreground">{v.astronaut.role}</span>
                  </th>
                  <td className="px-2.5 py-2">
                    <StatusBadge status={v.overall} />
                  </td>
                  {COLUMNS.map((k) => (
                    <td key={k} className="px-2.5 py-2 whitespace-nowrap">
                      <Cell view={v} k={k} canSeeMood={canSee(v)} />
                    </td>
                  ))}
                  <td className="px-2.5 py-2 whitespace-nowrap">{symptomText(v)}</td>
                  <td className="px-2.5 py-2 whitespace-nowrap">{routineCell(v)}</td>
                  <td className="px-2.5 py-2 whitespace-nowrap text-muted-foreground">{v.lastCheckIn ? `${formatClock(v.lastCheckIn)} MET` : "None today"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-border xl:hidden">
          {crew.map((v) => (
            <li key={v.astronaut.id} className="py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2>{nameCell(v, true)}</h2>
                <StatusBadge status={v.overall} className="type-small" />
              </div>
              <p className="type-small text-muted-foreground">
                {v.astronaut.role}. Routine: {routineWords(v.routine.entries, v.now).text}. {v.lastCheckIn ? `Last check-in ${formatClock(v.lastCheckIn)} MET.` : "No check-in today."}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 type-small sm:grid-cols-3">
                {COLUMNS.map((k) => (
                  <div key={k}>
                    <dt className="type-label text-muted-foreground">{INDICATORS[k].name}</dt>
                    <dd>
                      <Cell view={v} k={k} canSeeMood={canSee(v)} />
                    </dd>
                  </div>
                ))}
                <div>
                  <dt className="type-label text-muted-foreground">Symptoms</dt>
                  <dd>{symptomText(v)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <p className="mt-3 type-small text-muted-foreground">
          Crew routine today: {done} of {total} tasks done.
        </p>
      </section>

      <section aria-label="Habitat radiation" className="grid gap-x-10 gap-y-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div>
          <h2 className="type-section">Habitat radiation</h2>
          <p className="mt-1 type-caption text-subtle-foreground">Crew-wide, from the habitat dosimeter.</p>
          <div className="mt-3">
            <Facts
              rows={[
                [
                  "Current dose rate",
                  <span key="rate" className="inline-flex items-center gap-2">
                    {rad.valueText ? `${rad.valueText} ${rad.def.unit}` : "No reading"}
                    {rad.status !== "ok" && <StatusBadge status={rad.status} className="type-caption" />}
                  </span>,
                ],
                ["Normal range", rad.def.rangeText],
                ["Mission total, estimated", `${missionTotal.toFixed(1)} mGy`],
              ]}
            />
            <p className="mt-2 type-caption text-subtle-foreground">The total is the mean dose rate of the last 30 days times mission time. Simulated.</p>
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="type-small font-semibold">Dose rate, last 14 days</h3>
          <IndicatorChart astronautId={crew[0].astronaut.id} indicator="radiation" window="14d" alert={crew[0].alerts.find((a) => a.indicator === "radiation")} height={170} />
        </div>
      </section>

      <section aria-label="Earth downlink queue">
        <h2 className="type-section">Earth downlink queue</h2>
        {queue.length ? (
          <ul className="mt-2 divide-y divide-border">
            {queue.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-3 type-small">
                <span className="font-medium">{name(r.astronautId)}</span>
                <span className="text-muted-foreground">{URGENCY_LABEL[r.urgency]}</span>
                <span className="text-muted-foreground">{r.items.length ? r.items.map((i) => `${INDICATORS[i.indicator].name} ${i.valueText}`).join(", ") : "Routine report"}</span>
                <span className="ml-auto">
                  {r.state === "queued" && "Queued, waiting for the Earth link"}
                  {r.state === "in-transit" && `Sent ${formatClock(r.sentAt ?? r.createdAt)} MET, arrives ${formatClock(r.arrivesAt ?? r.createdAt)} MET`}
                  {r.state === "delivered" && `Delivered ${formatClock(r.arrivesAt ?? r.createdAt)} MET`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 type-small text-muted-foreground">No reports queued. Send one from the escalation section of any indicator.</p>
        )}
      </section>
      <CrewMemberSheet view={openedView} focus={opened?.focus} open={Boolean(opened)} onClose={() => setOpened(null)} showPrivate={Boolean(openedView && canSee(openedView))} />
    </main>
  );
}

export default function CrewOverview() {
  return (
    <AppShell>
      <Content />
    </AppShell>
  );
}
