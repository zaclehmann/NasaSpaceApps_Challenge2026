// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// App shell: header, warning bar, page content, the status bar (tablet and desktop) or bottom tabs (phone),
// and the overlays every page shares.
import { createContext, useContext, type ReactNode } from "react";
import type { Astronaut } from "@missionvitals/shared";
import { useWarningTone } from "../../audio/alertTone";
import { useAstronaut, useHealth } from "../../data/DataProvider";
import type { HealthView } from "../../data/health";
import { DemoSheet } from "../demo/DemoSheet";
import { ProcedureDialog } from "../measure/ProcedureDialog";
import { ReportSheet } from "../report/ReportSheet";
import { AppHeader } from "./AppHeader";
import { BottomTabs } from "./BottomTabs";
import { PostponeDialog, RoutinePage } from "./RoutineList";
import { SymptomDialog, SymptomsPage } from "./Symptoms";
import { Toast } from "./Toast";
import { StatusBar } from "./StatusBar";
import { StatusStrip } from "./StatusStrip";

const HealthContext = createContext<HealthView | null>(null);

/** The current astronaut's health view, or null before one is chosen. */
export function useCurrentHealth(): HealthView | null {
  return useContext(HealthContext);
}

/** One short tone when a Warning first appears for this crew member. Due checks are silent. */
function WarningTone({ view }: { view: HealthView }) {
  useWarningTone(view.alerts.filter((a) => a.status === "warning" && !a.acknowledged).map((a) => a.id));
  return null;
}

function Frame({ view, fixed, strip, children }: { view: HealthView | null; fixed: boolean; strip: boolean; children: ReactNode }) {
  const unacknowledged = view?.alerts.some((a) => a.status === "warning" && !a.acknowledged);
  return (
    <HealthContext.Provider value={view}>
      {/* Tablet and desktop: the window never scrolls. Header, strip and status bar stay put; only the
          page content scrolls, inside its own area (My Health scrolls per column). Phone scrolls the page. */}
      {/* relative: screen-reader-only text (absolutely positioned) anchors here, so the clip applies to it
          and it can never stretch the page below the window. */}
      <div className="relative flex flex-col bg-background max-md:min-h-dvh md:h-dvh md:overflow-hidden">
        <AppHeader />
        {view && (strip || unacknowledged) && <StatusStrip view={view} routine={strip} />}
        {fixed ? children : <div className="relative flex min-h-0 flex-1 flex-col md:overflow-y-auto">{children}</div>}
        {view && <StatusBar view={view} />}
        <div className="h-16 shrink-0 md:hidden" />
      </div>
      <BottomTabs />
      {view && <WarningTone view={view} />}
      {view && <RoutinePage view={view} />}
      {view && <PostponeDialog view={view} />}
      {view && <SymptomsPage view={view} />}
      {view && <SymptomDialog view={view} />}
      {view && <ProcedureDialog view={view} />}
      {view && <ReportSheet view={view} />}
      <DemoSheet />
      <Toast />
    </HealthContext.Provider>
  );
}

function WithHealth({ astronaut, fixed, strip, children }: { astronaut: Astronaut; fixed: boolean; strip: boolean; children: ReactNode }) {
  const view = useHealth(astronaut);
  return (
    <Frame view={view} fixed={fixed} strip={strip}>
      {children}
    </Frame>
  );
}

/**
 * `fixed`: fill the viewport and let columns scroll on their own (My Health on tablet and desktop).
 * `strip`: always show the status strip. Without it, the strip appears only for an unacknowledged Warning.
 */
export function AppShell({ fixed = false, strip = false, children }: { fixed?: boolean; strip?: boolean; children: ReactNode }) {
  const astronaut = useAstronaut();
  return astronaut ? (
    <WithHealth astronaut={astronaut} fixed={fixed} strip={strip}>
      {children}
    </WithHealth>
  ) : (
    <Frame view={null} fixed={fixed} strip={strip}>
      {children}
    </Frame>
  );
}
