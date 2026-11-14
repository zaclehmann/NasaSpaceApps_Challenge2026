// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Crew picker (ui.md 5.1): one tap, no password. Health shows as badge and word only, no values (privacy).
// Each row also says what is next in that person's routine and when they last checked in, so the
// tablet can be read at a glance. A row whose check is due now blinks, and the routine alarm rings.
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatClock, missionDay, nextTask, type RoutineEntry } from "@missionvitals/shared";
import { useDueAlarm } from "../audio/alertTone";
import { taskStatusText } from "../components/layout/RoutineList";
import { BadgeIcon, StatusBadge } from "../components/status/StatusBadge";
import { useCrewHealth, useData, useMission } from "../data/DataProvider";
import type { HealthView } from "../data/health";

function NextCheck({ e }: { e: RoutineEntry | undefined }) {
  if (!e) return <span className="type-small text-muted-foreground">All checks done today</span>;
  const kind = e.state.kind;
  return (
    <span className="flex min-w-0 flex-col">
      <span className={clsx("truncate type-small text-foreground", (kind === "due" || kind === "overdue") && "font-medium")}>{e.task.label}</span>
      <span
        className={clsx(
          "flex items-center gap-1.5 type-caption",
          kind === "due" ? "font-medium text-warning-text" : kind === "overdue" ? "text-watch-text" : "text-muted-foreground",
        )}
      >
        {kind === "due" && <span aria-hidden="true" className="size-1.5 rounded-full bg-warning" />}
        {kind === "overdue" && <BadgeIcon status="watch" size={12} />}
        {taskStatusText(e)}
      </span>
    </span>
  );
}

/** Every crew member's due-now checks go to the one app-wide alarm, which rings once per beat. */
function useCrewAlarm(crew: HealthView[]) {
  const items = crew.flatMap((v) => v.routine.entries.filter((e) => e.state.kind === "due").map((e) => ({ key: `${v.astronaut.id}:${e.task.id}:${e.dueAt}`, dueAt: e.dueAt })));
  useDueAlarm(items, crew[0]?.now ?? 0, false);
}

const COLS = "sm:grid-cols-[1.3fr_1fr_1.5fr_0.9fr_20px]";

export default function CrewPicker() {
  const { setAstronautId } = useData();
  const mission = useMission();
  const crew = useCrewHealth();
  useCrewAlarm(crew);
  return (
    <div className="min-h-dvh bg-background">
      <header className="flex h-12 items-center justify-between gap-4 border-b border-border px-4 type-small md:px-6">
        <span className="type-body font-semibold">MissionVitals</span>
        <span className="flex gap-4 whitespace-nowrap">
          <span className="max-sm:hidden">{mission.name}</span>
          <span className="text-muted-foreground">Mission day {missionDay(mission.met)}</span>
        </span>
      </header>
      <main className="mx-auto max-w-[920px] px-4 pt-[12vh] pb-12 md:px-6">
        <h1 className="type-title">Who's checking in?</h1>
        <p className="mt-1 type-small text-muted-foreground">Choose your name to open your health checks. No password on the crew tablet.</p>

        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <div aria-hidden="true" className={clsx("hidden gap-x-4 bg-muted px-4 py-2.5 type-label text-muted-foreground sm:grid", COLS)}>
            <span>Crew member</span>
            <span>Status</span>
            <span>Next check</span>
            <span>Last check-in</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {crew.map((v) => {
              const next = nextTask(v.routine.entries);
              const dueNow = next?.state.kind === "due";
              const open = v.alerts.filter((a) => !a.acknowledged).length;
              return (
                <li key={v.astronaut.id}>
                  <button
                    type="button"
                    onClick={() => setAstronautId(v.astronaut.id)}
                    aria-label={`${v.astronaut.name}, ${v.astronaut.role}${dueNow && next ? `. ${next.task.label} is due now` : ""}`}
                    className={clsx("grid min-h-[72px] w-full grid-cols-2 items-center gap-x-4 gap-y-2 px-4 py-3 text-left hover:bg-muted", COLS, dueNow && "anim-row-alert")}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate type-body font-semibold">{v.astronaut.name}</span>
                      <span className="truncate type-caption text-muted-foreground">{v.astronaut.role}</span>
                    </span>
                    <span className="flex flex-col items-start gap-0.5 max-sm:items-end">
                      <StatusBadge status={v.overall} className="type-small" />
                      {open > 0 && (
                        <span className="type-caption text-muted-foreground">
                          {open} {open === 1 ? "alert" : "alerts"} open
                        </span>
                      )}
                    </span>
                    <NextCheck e={next} />
                    <span className="type-small text-muted-foreground tabular-nums max-sm:text-right">{v.lastCheckIn ? formatClock(v.lastCheckIn) : "None today"}</span>
                    <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" className="text-subtle-foreground max-sm:hidden" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Link to="/crew" className="flex min-h-12 items-center type-small font-medium underline-offset-4 hover:underline">
            Open crew overview
          </Link>
          <span className="type-caption text-subtle-foreground">Times are MET. Simulated data for this demo.</span>
        </div>
      </main>
    </div>
  );
}
