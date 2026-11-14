// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Crew overview for the commander and crew medical officer (ui.md 5.9). Mood is private.
import { Lock } from "lucide-react";
import { INDICATORS, formatClock, formatMet, type IndicatorKey } from "@missionvitals/shared";
import { IndicatorChart } from "../components/charts/IndicatorChart";
import { AppShell } from "../components/layout/AppShell";
import { URGENCY_LABEL } from "../components/report/ReportSheet";
import { Facts } from "../components/panel/IndicatorDetail";
import { BadgeIcon, StatusBadge, StatusWord } from "../components/status/StatusBadge";
import { STATUS_TEXT } from "../components/status/statusStyles";
import { useAstronaut, useCrew, useCrewHealth, useData, useMission } from "../data/DataProvider";
import type { HealthView } from "../data/health";

const COLUMNS: IndicatorKey[] = ["hr", "bp", "spo2", "temp", "sleep", "mood"];

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
  if (!s.valueText) return <span className="text-muted-foreground">{s.ev.reason === "silent" ? "No data" : "Not taken"}</span>;
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
  const canSee = (v: HealthView) => Boolean(viewer && (viewer.isCmo || viewer.id === v.astronaut.id));
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
          Values at MET {formatMet(mission.met)}. Simulated data, demo thresholds.{" "}
          {viewer ? (viewer.isCmo ? "You are the crew medical officer, so mood is shown." : "Mood is private to each astronaut and the crew medical officer.") : "Choose an astronaut to see your own mood."}
        </p>
      </div>

      <section aria-label="Crew status">
        <div className="overflow-x-auto max-xl:hidden">
          <table className="w-full type-small">
            <thead className="bg-muted type-label text-muted-foreground">
              <tr>
                {["Name", "Overall", ...COLUMNS.map((k) => INDICATORS[k].name), "Routine today", "Last check-in"].map((h) => (
                  <th key={h} scope="col" className="px-2.5 py-2.5 text-left font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {crew.map((v) => (
                <tr key={v.astronaut.id} className="h-12 align-middle">
                  <th scope="row" className="px-2.5 py-2 text-left font-semibold whitespace-nowrap">
                    {v.astronaut.name}
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
                  <td className="px-2.5 py-2 whitespace-nowrap">
                    {v.routine.done} of {v.routine.total} done
                  </td>
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
                <h2 className="type-section">{v.astronaut.name}</h2>
                <StatusBadge status={v.overall} className="type-small" />
              </div>
              <p className="type-small text-muted-foreground">
                {v.astronaut.role}. Routine {v.routine.done} of {v.routine.total} done. {v.lastCheckIn ? `Last check-in ${formatClock(v.lastCheckIn)} MET.` : "No check-in today."}
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
                ["Demo range", rad.def.rangeText],
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
