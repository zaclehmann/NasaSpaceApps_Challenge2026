// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Crew picker (ui.md 5.1): one tap, no password. Badge and word only, no numbers (privacy).
import { Link } from "react-router-dom";
import { formatClock, missionDay } from "@missionvitals/shared";
import { StatusBadge } from "../components/status/StatusBadge";
import { useCrewHealth, useData, useMission } from "../data/DataProvider";

export default function CrewPicker() {
  const { setAstronautId } = useData();
  const mission = useMission();
  const crew = useCrewHealth();
  return (
    <div className="min-h-dvh bg-background">
      <header className="flex h-14 items-center justify-between gap-4 border-b border-border px-4 type-small md:px-6">
        <span className="type-body font-semibold">MissionVitals</span>
        <span className="flex gap-4 whitespace-nowrap">
          <span className="max-sm:hidden">{mission.name}</span>
          <span className="text-muted-foreground">Mission day {missionDay(mission.met)}</span>
        </span>
      </header>
      <main className="mx-auto max-w-[760px] px-4 py-12 md:px-6">
        <h1 className="type-title">Who's checking in?</h1>
        <ul className="mt-6 divide-y divide-border">
          {crew.map((v) => (
            <li key={v.astronaut.id}>
              <button
                type="button"
                onClick={() => setAstronautId(v.astronaut.id)}
                className="grid min-h-16 w-full grid-cols-2 items-center gap-x-4 gap-y-1 px-2 py-3 text-left hover:bg-muted sm:grid-cols-[1.3fr_1.3fr_1fr_auto]"
              >
                <span className="type-body font-semibold">{v.astronaut.name}</span>
                <span className="type-small text-muted-foreground max-sm:text-right">{v.astronaut.role}</span>
                <StatusBadge status={v.overall} className="type-small" />
                <span className="type-caption text-subtle-foreground max-sm:text-right">{v.lastCheckIn ? `Last check-in ${formatClock(v.lastCheckIn)}` : "No check-in today"}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 px-2">
          <Link to="/crew" className="flex min-h-12 items-center type-small font-medium hover:underline underline-offset-4">
            Open crew overview
          </Link>
          <span className="type-caption text-subtle-foreground">Simulated data for this demo</span>
        </div>
      </main>
    </div>
  );
}
