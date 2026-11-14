// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Crew picker (ui.md 5.1): one click or tap, no password. Health shows as badge and word only, no values (privacy).
// A crew roster: one line of summary, then a row per person with their status, what is next and when
// they last checked in. "Due now" is plain text: no tint, bar, dot or blinking (ui.md 3.3: status colour
// is for status only, and a check that is simply due is not a fault).
// Works the same with a mouse, a keyboard and touch: the whole row is one target, Up and Down move
// between people, Enter opens. Nothing depends on hover.
import clsx from "clsx";
import { useRef, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { formatClock, missionDay, nextTask, type RoutineEntry } from "@missionvitals/shared";
import { BadgeIcon, StatusBadge } from "../components/status/StatusBadge";
import { useCrewHealth, useData, useMission } from "../data/DataProvider";
import type { HealthView } from "../data/health";

/** "12 min", "1 h 24 min", "3 h". */
function span(sec: number): string {
  const m = Math.max(1, Math.round(sec / 60));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h} h ${rm} min` : `${h} h`;
}

/** When the next check is, relative to now. */
function nextWhen(e: RoutineEntry, now: number): string {
  if (e.state.kind === "due") return "Due now";
  if (e.state.kind === "overdue") return `Overdue ${span(e.state.minutes * 60)}`;
  const label = e.postponed ? "Postponed, due" : "Due";
  return `${label} ${formatClock(e.dueAt)}, in ${span(e.dueAt - now)}`;
}

function NextCheck({ e, now }: { e: RoutineEntry | undefined; now: number }) {
  if (!e) return <span className="type-small text-muted-foreground">All checks done today</span>;
  const k = e.state.kind;
  return (
    <span className="flex min-w-0 flex-col">
      <span className={clsx("truncate type-small text-foreground", (k === "due" || k === "overdue") && "font-medium")}>{e.task.label}</span>
      <span className={clsx("flex items-center gap-1.5 type-caption tabular-nums", k === "due" ? "font-medium text-foreground" : k === "overdue" ? "text-watch-text" : "text-muted-foreground")}>
        {k === "overdue" && <BadgeIcon status="watch" size={12} />}
        {nextWhen(e, now)}
      </span>
    </span>
  );
}

/** "3 crew. 2 checks due now. 1 caution." Plain sentences, no counters in badges. */
function summary(crew: HealthView[]): string {
  const due = crew.reduce((n, v) => n + v.routine.entries.filter((e) => e.state.kind === "due" || e.state.kind === "overdue").length, 0);
  const warn = crew.filter((v) => v.overall === "warning").length;
  const caution = crew.filter((v) => v.overall === "caution").length;
  const parts = [`${crew.length} crew.`];
  parts.push(due === 0 ? "No checks due." : `${due} ${due === 1 ? "check" : "checks"} due now.`);
  if (warn) parts.push(`${warn} ${warn === 1 ? "warning" : "warnings"}.`);
  if (caution) parts.push(`${caution} ${caution === 1 ? "caution" : "cautions"}.`);
  if (!warn && !caution) parts.push("Everyone is in range.");
  return parts.join(" ");
}

const COLS = "md:grid-cols-[minmax(170px,1.2fr)_minmax(130px,0.9fr)_minmax(200px,1.4fr)_minmax(110px,0.8fr)]";

export default function CrewPicker() {
  const { setAstronautId } = useData();
  const mission = useMission();
  const crew = useCrewHealth();
  const list = useRef<HTMLUListElement>(null);
  const now = crew[0]?.now ?? mission.met;

  // Desktop list behaviour: Up and Down move between people, Home and End jump. Enter and Space open (native).
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const rows = [...(list.current?.querySelectorAll<HTMLButtonElement>("button[data-row]") ?? [])];
    const i = rows.indexOf(e.currentTarget);
    const go = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: rows.length - 1 }[e.key];
    if (go === undefined) return;
    e.preventDefault();
    rows[Math.max(0, Math.min(rows.length - 1, go))]?.focus();
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex h-12 items-center justify-between gap-4 border-b border-border px-4 type-small md:px-6">
        <span className="type-body font-semibold">MissionVitals</span>
        <span className="flex gap-4 whitespace-nowrap tabular-nums">
          <span className="max-sm:hidden">{mission.name}</span>
          <span className="text-muted-foreground">Mission day {missionDay(mission.met)}</span>
          <span className="text-muted-foreground max-sm:hidden">{formatClock(mission.met)} MET</span>
        </span>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 pt-[10vh] pb-12 md:px-6">
        <h1 className="type-title">Who's checking in?</h1>
        <p className="mt-1 type-small text-muted-foreground">Choose your name to open your health checks. No password on the crew tablet.</p>
        <p className="mt-6 type-body" aria-live="polite">
          {summary(crew)}
        </p>

        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <div aria-hidden="true" className={clsx("hidden items-center gap-x-5 bg-muted px-4 py-2.5 type-label text-muted-foreground md:grid", COLS)}>
            <span>Crew member</span>
            <span>Status</span>
            <span>Next check</span>
            <span>Last check-in</span>
          </div>
          <ul ref={list} className="divide-y divide-border">
            {crew.map((v) => {
              const next = nextTask(v.routine.entries);
              const open = v.alerts.filter((a) => !a.acknowledged).length;
              const last = v.lastCheckIn;
              return (
                <li key={v.astronaut.id}>
                  <button
                    type="button"
                    data-row
                    onClick={() => setAstronautId(v.astronaut.id)}
                    onKeyDown={onKey}
                    aria-label={`${v.astronaut.name}, ${v.astronaut.role}. ${next ? `${next.task.label}, ${nextWhen(next, now).toLowerCase()}.` : "All checks done today."}`}
                    className={clsx(
                      "group grid min-h-[72px] w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-5 gap-y-2 px-4 py-3 text-left transition-colors duration-[120ms] hover:bg-muted focus-visible:-outline-offset-2",
                      COLS,
                    )}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate type-body font-semibold">{v.astronaut.name}</span>
                      <span className="truncate type-caption text-muted-foreground">{v.astronaut.role}</span>
                    </span>
                    <span className="flex flex-col items-start gap-0.5 max-md:col-start-2 max-md:row-start-1 max-md:items-end">
                      <StatusBadge status={v.overall} className="type-small" />
                      {open > 0 && (
                        <span className="type-caption text-muted-foreground">
                          {open} {open === 1 ? "alert" : "alerts"} open
                        </span>
                      )}
                    </span>
                    <NextCheck e={next} now={now} />
                    <span className="type-small text-muted-foreground tabular-nums max-md:text-right">{last ? (now - last < 60 ? "Just now" : `${span(now - last)} ago`) : "None today"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-3 type-caption text-subtle-foreground">
          <span>
            Times are MET. Simulated data for this demo.
            {/* Keyboard hint only where there is a mouse or trackpad. */}
            <span className="hidden [@media(pointer:fine)]:inline"> Up and Down move between crew, Enter opens.</span>
          </span>
        </div>

        <Link to="/crew" className="mt-4 inline-flex min-h-12 items-center type-small font-medium underline-offset-4 hover:underline">
          Open crew overview
        </Link>
      </main>
    </div>
  );
}
