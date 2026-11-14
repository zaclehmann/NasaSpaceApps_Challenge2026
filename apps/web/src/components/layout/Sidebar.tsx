// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Navigation sidebar, opened from the header menu button. A slide-in panel from the left, in four parts:
//   Who: the crew member whose data is on screen, their overall status and Switch.
//   Go: every page, with live counts where they help (routine progress, active symptoms).
//   Mission: vehicle, day, clock, Earth link and reports waiting, as plain label and value rows.
//   Display: theme and demo controls. The simulated-data notice sits at the foot.
// Built on Radix Dialog: focus is trapped, Escape closes, focus returns to the menu button.
import * as RD from "@radix-ui/react-dialog";
import clsx from "clsx";
import { BookOpen, ClipboardList, FlaskConical, HeartPulse, ListChecks, Menu, MousePointerClick, SlidersHorizontal, Stethoscope, Users, X, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { formatDelay, formatMet, missionDay, type Status } from "@missionvitals/shared";
import { useAstronaut, useData, useMission } from "../../data/DataProvider";
import { useUi } from "../../state/ui";
import { useClickFeedback } from "../../audio/clickFeedback";
import { useThemeChoice, type ThemeChoice } from "../../theme/useTheme";
import { BadgeIcon, StatusBadge } from "../status/StatusBadge";
import { useCurrentHealth } from "./AppShell";

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

/** One row: 32 px on desktop, 40 px where it is touched. */
const row = "relative flex h-10 w-full items-center gap-2.5 rounded-md px-2 text-left type-small xl:h-8";
const idle = "text-muted-foreground hover:bg-muted hover:text-foreground";
const current = "bg-muted font-medium text-foreground before:absolute before:inset-y-1.5 before:-left-2 before:w-[3px] before:rounded-r-full before:bg-foreground before:content-['']";

function Group({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-border px-2 pt-2 pb-3">
      <h2 id={id} className="px-2 pt-1 pb-1.5 type-caption font-medium text-subtle-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Right-hand detail on a page row: a count, or a status mark and word when something needs attention. */
function Meta({ status, children }: { status?: Status; children: ReactNode }) {
  const flagged = status && status !== "ok" && status !== "due";
  return (
    <span className={clsx("ml-auto flex items-center gap-1 type-caption tabular-nums", flagged ? "text-foreground" : "text-subtle-foreground")}>
      {flagged && <BadgeIcon status={status} size={12} />}
      {children}
    </span>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3 px-2 type-small">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right tabular-nums">{children}</dd>
    </div>
  );
}

const THEMES: { id: ThemeChoice; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

/** On or off for the key tick and touch vibration on every press. The state is in the word, not only the icon. */
function ClickFeedbackRow() {
  const [on, setOn] = useClickFeedback();
  return (
    <button type="button" role="switch" aria-checked={on} className={clsx(row, idle)} onClick={() => setOn(!on)} title="A quiet key tick on each press, and a short vibration on touch screens that support it">
      <MousePointerClick size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
      Click feedback
      <Meta>{on ? "On" : "Off"}</Meta>
    </button>
  );
}

function ThemeSwitch() {
  const [theme, setTheme] = useThemeChoice();
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 rounded-md bg-muted p-0.5">
      {THEMES.map((t) => {
        const on = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setTheme(t.id)}
            className={clsx("h-9 rounded-[5px] type-caption font-medium transition-colors duration-[120ms] xl:h-7", on ? "bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-muted-foreground hover:text-foreground")}
          >
            {t.label}
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
  const view = useCurrentHealth();
  const { source } = useData();
  const { setDemoOpen, setRoutineOpen, setSymptomsOpen, routineOpen, symptomsOpen } = useUi();
  const switchAstronaut = useSwitchAstronaut();
  const { pathname } = useLocation();
  const close = () => setOpen(false);

  const routine = view?.routine;
  const overdue = routine?.entries.filter((e) => e.state.kind === "overdue").length ?? 0;
  const symptomStatuses = view ? Object.values(view.parts) : [];
  const worstSymptom: Status | undefined = symptomStatuses.includes("warning") ? "warning" : symptomStatuses.includes("caution") ? "caution" : symptomStatuses.length ? "watch" : undefined;
  const queued = source.getDownlinkQueue().filter((r) => r.state === "queued").length;
  const inTransit = source.getDownlinkQueue().filter((r) => r.state === "in-transit").length;
  const overlayOpen = routineOpen || symptomsOpen;

  return (
    <RD.Root open={open} onOpenChange={setOpen}>
      <RD.Trigger
        className="relative -ml-1 flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground max-xl:size-10 max-xl:before:absolute max-xl:before:-inset-1 max-xl:before:content-['']"
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
          className="anim-sidebar fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col border-r border-border bg-card text-foreground shadow-float outline-none sm:rounded-r-xl"
        >
          <RD.Title className="sr-only">Navigation</RD.Title>
          <RD.Description className="sr-only">Pages, mission status and display settings</RD.Description>

          <div className="flex h-12 shrink-0 items-center justify-between pr-2 pl-4">
            <span className="type-body font-semibold">MissionVitals</span>
            <RD.Close className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground max-xl:size-10" aria-label="Close navigation">
              <X size={16} strokeWidth={1.75} aria-hidden="true" />
            </RD.Close>
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto">
            {astronaut && (
              <section aria-label="Crew member" className="border-t border-border px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate type-small font-semibold">{astronaut.name}</p>
                    <p className="truncate type-caption text-muted-foreground">{astronaut.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      switchAstronaut();
                    }}
                    className="relative -mr-1 rounded-md px-2 py-1 type-caption font-medium text-foreground hover:bg-muted max-xl:before:absolute max-xl:before:inset-x-0 max-xl:before:-inset-y-2.5 max-xl:before:content-['']"
                  >
                    Switch
                  </button>
                </div>
                {view && view.overall !== "ok" && view.overall !== "due" && (
                  <p className="mt-1.5 type-caption">
                    <StatusBadge status={view.overall} />
                  </p>
                )}
              </section>
            )}

            <Group id="sidebar-go" title="Go to">
              <nav aria-label="Main">
                <ul className="flex flex-col gap-px">
                  {NAV.map((n, i) => {
                    const Icon = n.icon;
                    const on = pathname === n.to && !overlayOpen;
                    return (
                      <li key={n.to} className="contents">
                        <NavLink
                          to={n.to}
                          end
                          onClick={() => {
                            setRoutineOpen(false);
                            setSymptomsOpen(false);
                            close();
                          }}
                          aria-current={on ? "page" : undefined}
                          className={clsx(row, on ? current : idle)}
                        >
                          <Icon size={16} strokeWidth={on ? 2 : 1.5} aria-hidden="true" className="shrink-0" />
                          {n.label}
                        </NavLink>
                        {i === 0 && view && (
                          <>
                            <button
                              type="button"
                              aria-current={routineOpen ? "page" : undefined}
                              onClick={() => {
                                close();
                                setSymptomsOpen(false);
                                setRoutineOpen(true);
                              }}
                              className={clsx(row, routineOpen ? current : idle)}
                            >
                              <ListChecks size={16} strokeWidth={routineOpen ? 2 : 1.5} aria-hidden="true" className="shrink-0" />
                              Today's routine
                              {routine && <Meta status={overdue ? "watch" : undefined}>{overdue ? `${overdue} overdue` : `${routine.done} of ${routine.total}`}</Meta>}
                            </button>
                            <button
                              type="button"
                              aria-current={symptomsOpen ? "page" : undefined}
                              onClick={() => {
                                close();
                                setRoutineOpen(false);
                                setSymptomsOpen(true);
                              }}
                              className={clsx(row, symptomsOpen ? current : idle)}
                            >
                              <Stethoscope size={16} strokeWidth={symptomsOpen ? 2 : 1.5} aria-hidden="true" className="shrink-0" />
                              Symptoms
                              <Meta status={worstSymptom}>{symptomStatuses.length ? `${symptomStatuses.length} active` : "None"}</Meta>
                            </button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </Group>

            <Group id="sidebar-mission" title="Mission">
              <dl>
                <Fact label="Vehicle">{mission.name}</Fact>
                <Fact label="Mission day">{missionDay(mission.met)}</Fact>
                <Fact label="Mission clock">MET {formatMet(mission.met)}</Fact>
                <Fact label="Earth link">
                  {mission.earthLink.up ? (
                    `Up, ${formatDelay(mission.earthLink.delaySec)} one way`
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-caution-text">
                      <BadgeIcon status="caution" size={12} />
                      Down
                    </span>
                  )}
                </Fact>
                <Fact label="Reports to Earth">
                  {queued ? `${queued} waiting` : inTransit ? `${inTransit} on the way` : "None waiting"}
                </Fact>
              </dl>
            </Group>

            <Group id="sidebar-display" title="Display">
              <div className="px-2 pb-2">
                <ThemeSwitch />
              </div>
              <ClickFeedbackRow />
              <button
                type="button"
                className={clsx(row, idle)}
                onClick={() => {
                  close();
                  setDemoOpen(true);
                }}
              >
                <SlidersHorizontal size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                Demo controls
                <Meta>Scenarios</Meta>
              </button>
            </Group>
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-3 type-caption text-subtle-foreground">
            <ClipboardList size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
            Simulated data, demo thresholds
          </div>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
