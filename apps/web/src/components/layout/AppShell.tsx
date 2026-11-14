// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// App shell: header, warning bar, page content, bottom tabs on phone, and the overlays every page shares.
import clsx from "clsx";
import { createContext, useContext, type ReactNode } from "react";
import type { Astronaut } from "@missionvitals/shared";
import { useAstronaut, useHealth } from "../../data/DataProvider";
import type { HealthView } from "../../data/health";
import { DemoSheet } from "../demo/DemoSheet";
import { ProcedureDialog } from "../measure/ProcedureDialog";
import { ReportSheet } from "../report/ReportSheet";
import { AppHeader } from "./AppHeader";
import { BottomTabs } from "./BottomTabs";
import { Toast } from "./Toast";
import { StatusStrip } from "./StatusStrip";

const HealthContext = createContext<HealthView | null>(null);

/** The current astronaut's health view, or null before one is chosen. */
export function useCurrentHealth(): HealthView | null {
  return useContext(HealthContext);
}

function Frame({ view, fixed, strip, children }: { view: HealthView | null; fixed: boolean; strip: boolean; children: ReactNode }) {
  const unacknowledged = view?.alerts.some((a) => a.status === "warning" && !a.acknowledged);
  return (
    <HealthContext.Provider value={view}>
      <div className={clsx("flex flex-col bg-background", fixed ? "md:h-dvh md:overflow-hidden max-md:min-h-dvh" : "min-h-dvh")}>
        <AppHeader />
        {view && (strip || unacknowledged) && <StatusStrip view={view} routine={strip} />}
        {children}
        <div className="h-16 shrink-0 md:hidden" />
      </div>
      <BottomTabs />
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
