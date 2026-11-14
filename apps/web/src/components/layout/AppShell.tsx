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
import { WarningBar } from "./WarningBar";

const HealthContext = createContext<HealthView | null>(null);

/** The current astronaut's health view, or null before one is chosen. */
export function useCurrentHealth(): HealthView | null {
  return useContext(HealthContext);
}

function Frame({ view, fixed, children }: { view: HealthView | null; fixed: boolean; children: ReactNode }) {
  return (
    <HealthContext.Provider value={view}>
      <div className={clsx("flex flex-col bg-background", fixed ? "md:h-dvh md:overflow-hidden max-md:min-h-dvh" : "min-h-dvh")}>
        <AppHeader />
        {view && <WarningBar view={view} />}
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

function WithHealth({ astronaut, fixed, children }: { astronaut: Astronaut; fixed: boolean; children: ReactNode }) {
  const view = useHealth(astronaut);
  return (
    <Frame view={view} fixed={fixed}>
      {children}
    </Frame>
  );
}

/** `fixed`: fill the viewport and let columns scroll on their own (My Health on tablet and desktop). */
export function AppShell({ fixed = false, children }: { fixed?: boolean; children: ReactNode }) {
  const astronaut = useAstronaut();
  return astronaut ? (
    <WithHealth astronaut={astronaut} fixed={fixed}>
      {children}
    </WithHealth>
  ) : (
    <Frame view={null} fixed={fixed}>
      {children}
    </Frame>
  );
}
