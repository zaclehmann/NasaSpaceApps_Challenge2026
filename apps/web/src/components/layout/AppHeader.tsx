// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Header, 48 px: sidebar button, product and pages on the left, mission facts centred, the astronaut on the right.
// Separate items divided by spacing and hairlines, never joined with dots (ui.md 2).
// From 1280 to 1536 px the page links share the bar, so vehicle and MET step out (they are in the sidebar).
import clsx from "clsx";
import { Link, NavLink } from "react-router-dom";
import { formatDelay, formatMet, missionDay } from "@missionvitals/shared";
import { useAstronaut, useData, useMission } from "../../data/DataProvider";
import { useUi } from "../../state/ui";
import { BadgeIcon } from "../status/StatusBadge";
import { Button } from "../ui/Button";
import { NAV, Sidebar, useSwitchAstronaut } from "./Sidebar";

const Rule = ({ className }: { className?: string }) => <span aria-hidden="true" className={clsx("h-5 w-px shrink-0 bg-border", className)} />;

export function EarthLinkStatus({ className }: { className?: string }) {
  const { source } = useData();
  const mission = useMission();
  const queued = source.getDownlinkQueue().filter((r) => r.state === "queued").length;
  if (mission.earthLink.up) {
    return <span className={clsx("whitespace-nowrap text-muted-foreground", className)}>Earth link up, {formatDelay(mission.earthLink.delaySec)}</span>;
  }
  return (
    <span className={clsx("flex items-center gap-1.5 whitespace-nowrap text-caution-text", className)}>
      <BadgeIcon status="caution" />
      {queued === 0 ? "Earth link down" : `Earth link down, ${queued} ${queued === 1 ? "report" : "reports"} queued`}
    </span>
  );
}

export function AppHeader() {
  const astronaut = useAstronaut();
  const mission = useMission();
  const { setDemoOpen } = useUi();
  const switchAstronaut = useSwitchAstronaut();
  return (
    <header className="grid h-12 shrink-0 grid-cols-[auto_1fr] items-center gap-4 md:grid-cols-[1fr_auto_1fr] border-b border-border bg-background px-4 type-small">
      <div className="flex min-w-0 items-center gap-3 md:min-w-max">
        <Sidebar />
        <Link to="/" className="flex h-12 items-center type-body font-semibold whitespace-nowrap max-md:hidden">
          MissionVitals
        </Link>
        <nav aria-label="Main" className="ml-1 flex h-12 items-stretch gap-4 max-xl:hidden">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end
              className={({ isActive }) => clsx("flex items-center border-b-2 px-0.5 whitespace-nowrap", isActive ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        {astronaut && <span className="truncate font-medium md:hidden">{astronaut.name}</span>}
      </div>

      <div className="flex min-w-0 items-center justify-end gap-4 md:justify-center">
        <span className="whitespace-nowrap max-2xl:hidden">{mission.name}</span>
        <span className="whitespace-nowrap text-muted-foreground max-md:hidden">Mission day {missionDay(mission.met)}</span>
        <span className="whitespace-nowrap text-muted-foreground max-2xl:hidden">MET {formatMet(mission.met)}</span>
        <Rule className="max-md:hidden" />
        <EarthLinkStatus />
      </div>

      <div className="flex items-center justify-end gap-3 max-md:hidden">
        {astronaut && <span className="font-medium whitespace-nowrap">{astronaut.name}</span>}
        <Button variant="text" size="sm" className="text-muted-foreground" onClick={switchAstronaut}>
          Switch
        </Button>
        <Button variant="text" size="sm" className="text-muted-foreground" onClick={() => setDemoOpen(true)}>
          Demo
        </Button>
      </div>
    </header>
  );
}
