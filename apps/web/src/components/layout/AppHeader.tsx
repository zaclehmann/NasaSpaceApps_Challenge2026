// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Header, 48 px: product and pages on the left, mission facts and the astronaut on the right.
// Separate items divided by spacing and hairlines, never joined with dots (ui.md 2).
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
      Earth link down, {queued} {queued === 1 ? "report" : "reports"} queued
    </span>
  );
}

export function AppHeader() {
  const astronaut = useAstronaut();
  const mission = useMission();
  const { setAstronautId } = useData();
  const { setDemoOpen, resetSelection } = useUi();
  const navigate = useNavigate();
  const switchAstronaut = () => {
    resetSelection();
    setAstronautId(null);
    navigate("/");
  };
  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border bg-background px-4 type-small">
      <Link to="/" className="flex h-12 items-center type-body font-semibold max-md:hidden">
        MissionVitals
      </Link>
      <nav aria-label="Main" className="flex h-12 items-stretch gap-4 max-xl:hidden">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end
            className={({ isActive }) => clsx("flex items-center border-b-2 px-0.5", isActive ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
      <Popover.Root>
        <Popover.Trigger className="flex size-12 items-center justify-center rounded-md hover:bg-muted max-md:hidden xl:hidden" aria-label="Pages">
          <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="start" sideOffset={4} className="z-50 w-56 rounded-lg bg-card p-2 text-foreground shadow-float outline-none">
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

      {astronaut && <span className="font-medium md:hidden">{astronaut.name}</span>}
      <div className="ml-auto flex items-center gap-4">
        <span className="whitespace-nowrap max-lg:hidden">{mission.name}</span>
        <span className="whitespace-nowrap text-muted-foreground max-md:hidden">Mission day {missionDay(mission.met)}</span>
        <span className="whitespace-nowrap text-muted-foreground max-lg:hidden">MET {formatMet(mission.met)}</span>
        <Rule className="max-md:hidden" />
        <EarthLinkStatus />
        <Rule className="max-md:hidden" />
        <div className="flex items-center gap-3 max-md:hidden">
          {astronaut && <span className="font-medium whitespace-nowrap">{astronaut.name}</span>}
          <Button variant="text" size="sm" className="text-muted-foreground" onClick={switchAstronaut}>
            Switch
          </Button>
          <Button variant="text" size="sm" className="text-muted-foreground" onClick={() => setDemoOpen(true)}>
            Demo
          </Button>
        </div>
      </div>
    </header>
  );
}
