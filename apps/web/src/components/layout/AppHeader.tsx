// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Header, 56 px (ui.md 5.2): separate items divided by spacing and vertical hairlines, never joined with dots.
import * as Popover from "@radix-ui/react-popover";
import clsx from "clsx";
import { Menu } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { formatDelay, formatMet, missionDay } from "@missionvitals/shared";
import { useAstronaut, useData, useMission } from "../../data/DataProvider";
import { useUi } from "../../state/ui";
import { BadgeIcon } from "../status/StatusBadge";
import { Button } from "../ui/Button";

const NAV = [
  { to: "/", label: "My health" },
  { to: "/crew", label: "Crew" },
  { to: "/learn", label: "Learn" },
  { to: "/methodology", label: "Methodology" },
];

const Rule = ({ className }: { className?: string }) => <span aria-hidden="true" className={clsx("h-6 w-px shrink-0 bg-border", className)} />;

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
      Earth link down, {queued} {queued === 1 ? "report" : "reports"} queued
    </span>
  );
}

export function MissionBlock({ className }: { className?: string }) {
  const mission = useMission();
  return (
    <div className={clsx("items-center gap-4 whitespace-nowrap", className)}>
      <span className="max-lg:hidden">{mission.name}</span>
      <span className="text-muted-foreground">Mission day {missionDay(mission.met)}</span>
      <span className="text-muted-foreground max-lg:hidden">MET {formatMet(mission.met)}</span>
    </div>
  );
}

export function AppHeader() {
  const astronaut = useAstronaut();
  const { setAstronautId } = useData();
  const { setDemoOpen, resetSelection } = useUi();
  const navigate = useNavigate();
  const switchAstronaut = () => {
    resetSelection();
    setAstronautId(null);
    navigate("/");
  };
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx("flex h-14 items-center border-b-2 px-1", isActive ? "border-foreground font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground");
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 type-small">
      <Link to="/" className="type-body font-semibold max-md:hidden">
        MissionVitals
      </Link>
      <Rule className="max-md:hidden" />
      <MissionBlock className="flex max-md:hidden" />
      <Rule className="max-md:hidden" />
      {astronaut && <span className="font-medium md:hidden">{astronaut.name}</span>}
      <EarthLinkStatus className="max-md:ml-auto" />
      <div className="ml-auto flex items-center gap-3 max-md:hidden">
        <nav aria-label="Main" className="flex items-center gap-4 max-xl:hidden">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end className={linkClass}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <Popover.Root>
          <Popover.Trigger className="flex size-12 items-center justify-center rounded-md hover:bg-muted xl:hidden" aria-label="Menu">
            <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content align="end" sideOffset={4} className="z-50 w-56 rounded-lg bg-card p-2 text-foreground shadow-float outline-none">
              <nav aria-label="Main" className="flex flex-col">
                {NAV.map((n) => (
                  <Popover.Close asChild key={n.to}>
                    <NavLink to={n.to} end className={({ isActive }) => clsx("flex min-h-12 items-center rounded-md px-3 type-small hover:bg-muted", isActive && "font-semibold")}>
                      {n.label}
                    </NavLink>
                  </Popover.Close>
                ))}
              </nav>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <Rule />
        {astronaut && <span className="font-medium whitespace-nowrap">{astronaut.name}</span>}
        <Button variant="text" size="sm" onClick={switchAstronaut}>
          Switch
        </Button>
        <Button size="sm" onClick={() => setDemoOpen(true)}>
          Demo
        </Button>
      </div>
    </header>
  );
}
