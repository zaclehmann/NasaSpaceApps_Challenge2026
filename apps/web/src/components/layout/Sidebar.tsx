// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Navigation sidebar, opened from the header menu button. Modelled on the GitHub and Vercel drawers:
// a slide-in panel from the left with compact icon rows, a marker on the current page, grouped sections
// and the signed-in crew member at the foot. Built on Radix Dialog: focus is trapped, Escape closes,
// focus returns to the menu button.
import * as RD from "@radix-ui/react-dialog";
import clsx from "clsx";
import {
  ArrowLeftRight,
  BookOpen,
  CalendarDays,
  Clock,
  FlaskConical,
  HeartPulse,
  Menu,
  Monitor,
  Moon,
  Rocket,
  Satellite,
  SlidersHorizontal,
  Sun,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { formatDelay, formatMet, missionDay } from "@missionvitals/shared";
import { useAstronaut, useData, useMission } from "../../data/DataProvider";
import { useUi } from "../../state/ui";
import { useThemeChoice, type ThemeChoice } from "../../theme/useTheme";

export const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "My health", icon: HeartPulse },
  { to: "/crew", label: "Crew", icon: Users },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/methodology", label: "Methodology", icon: FlaskConical },
];

/** Back to the crew picker. */
export function useSwitchAstronaut() {
  const { setAstronautId } = useData();
  const { resetSelection } = useUi();
  const navigate = useNavigate();
  return () => {
    resetSelection();
    setAstronautId(null);
    navigate("/");
  };
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** One compact row: 32 px on desktop, 40 px where it is touched. */
const row = "relative flex h-10 w-full items-center gap-2.5 rounded-md px-2 type-small xl:h-8";

function SectionLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="px-4 pt-3 pb-1 type-caption font-medium text-subtle-foreground">
      {children}
    </h2>
  );
}

const Divider = () => <div aria-hidden="true" className="mx-4 my-2 h-px bg-border" />;

function Fact({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex h-8 items-center gap-2.5 px-2 type-small">
      <Icon size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-muted-foreground" />
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="ml-auto truncate text-right tabular-nums">{children}</dd>
    </div>
  );
}

const THEMES: { id: ThemeChoice; label: string; icon: LucideIcon }[] = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

function ThemeSwitch() {
  const [theme, setTheme] = useThemeChoice();
  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-md border border-border p-0.5">
      {THEMES.map((t) => {
        const on = theme === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={t.label}
            title={t.label}
            onClick={() => setTheme(t.id)}
            className={clsx("flex size-7 items-center justify-center rounded-[5px]", on ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const astronaut = useAstronaut();
  const mission = useMission();
  const { setDemoOpen } = useUi();
  const switchAstronaut = useSwitchAstronaut();
  const close = () => setOpen(false);

  return (
    <RD.Root open={open} onOpenChange={setOpen}>
      <RD.Trigger
        className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground max-xl:size-10"
        aria-label="Open navigation"
      >
        <Menu size={16} strokeWidth={1.75} aria-hidden="true" />
      </RD.Trigger>
      <RD.Portal>
        <RD.Overlay className="anim-scrim fixed inset-0 z-40 bg-scrim" />
        <RD.Content
          onOpenAutoFocus={(e) => {
            // Focus the panel itself, so the close button does not open with a focus ring.
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }}
          className="anim-sidebar fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col border-r border-border bg-card text-foreground shadow-float outline-none sm:rounded-r-xl">
          <RD.Title className="sr-only">Navigation</RD.Title>
          <RD.Description className="sr-only">Pages, mission status and settings</RD.Description>

          <div className="flex h-14 shrink-0 items-center justify-between pr-2 pl-4">
            <span className="flex items-center gap-2 type-body font-semibold">
              <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <HeartPulse size={14} strokeWidth={2} />
              </span>
              MissionVitals
            </span>
            <RD.Close className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground max-xl:size-10" aria-label="Close navigation">
              <X size={16} strokeWidth={1.75} aria-hidden="true" />
            </RD.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pb-2">
            <nav aria-label="Main" className="px-2">
              <ul className="flex flex-col gap-px">
                {NAV.map((n) => {
                  const Icon = n.icon;
                  return (
                    <li key={n.to}>
                      <NavLink
                        to={n.to}
                        end
                        onClick={close}
                        className={({ isActive }) =>
                          clsx(
                            row,
                            isActive
                              ? "bg-muted font-medium text-foreground before:absolute before:inset-y-1.5 before:-left-2 before:w-1 before:rounded-r-full before:bg-foreground before:content-['']"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon size={16} strokeWidth={isActive ? 2 : 1.5} aria-hidden="true" className="shrink-0" />
                            {n.label}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <Divider />

            <section aria-labelledby="sidebar-mission">
              <SectionLabel id="sidebar-mission">Mission</SectionLabel>
              <dl className="px-2">
                <Fact icon={Rocket} label="Vehicle">
                  {mission.name}
                </Fact>
                <Fact icon={CalendarDays} label="Mission day">
                  {missionDay(mission.met)}
                </Fact>
                <Fact icon={Clock} label="MET">
                  {formatMet(mission.met)}
                </Fact>
                <Fact icon={Satellite} label="Earth link">
                  <span className={clsx("inline-flex items-center gap-1.5", !mission.earthLink.up && "text-caution-text")}>
                    <span aria-hidden="true" className={clsx("size-1.5 rounded-full", mission.earthLink.up ? "bg-ok" : "bg-caution")} />
                    {mission.earthLink.up ? `Up, ${formatDelay(mission.earthLink.delaySec)}` : "Down"}
                  </span>
                </Fact>
              </dl>
            </section>

            <Divider />

            <section aria-labelledby="sidebar-tools">
              <SectionLabel id="sidebar-tools">Tools</SectionLabel>
              <div className="flex flex-col gap-px px-2">
                <button
                  type="button"
                  className={clsx(row, "text-muted-foreground hover:bg-muted hover:text-foreground")}
                  onClick={() => {
                    close();
                    setDemoOpen(true);
                  }}
                >
                  <SlidersHorizontal size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                  Demo controls
                </button>
                <div className={clsx(row, "justify-between text-muted-foreground")}>
                  <span className="flex items-center gap-2.5">
                    <Monitor size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                    Theme
                  </span>
                  <ThemeSwitch />
                </div>
              </div>
            </section>
          </div>

          {astronaut && (
            <div className="flex shrink-0 items-center gap-2.5 border-t border-border px-4 py-3">
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary type-caption font-semibold">
                {initials(astronaut.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate type-small font-medium">{astronaut.name}</p>
                <p className="truncate type-caption text-muted-foreground">{astronaut.role}</p>
              </div>
              <button
                type="button"
                title="Switch crew member"
                aria-label="Switch crew member"
                onClick={() => {
                  close();
                  switchAstronaut();
                }}
                className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground max-xl:size-10"
              >
                <ArrowLeftRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          )}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
