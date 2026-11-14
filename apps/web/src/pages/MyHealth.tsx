// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// My Health (ui.md 5.2): my numbers, where in my body, what to do.
// Desktop: three columns. Tablet: two columns and a right sheet. Phone: bottom tabs and full pages.
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { INDICATORS, INDICATOR_KEYS, type ChartWindow, type IndicatorKey } from "@missionvitals/shared";
import { BodyFooter } from "../components/body/BodyFooter";
import { BodyStage } from "../components/body/BodyStage";
import { IndicatorChart } from "../components/charts/IndicatorChart";
import { IndicatorList } from "../components/indicators/IndicatorList";
import { AppShell, useCurrentHealth } from "../components/layout/AppShell";
import { usePhoneTab } from "../components/layout/BottomTabs";
import { DetailBody, selectionTitle } from "../components/panel/DetailPanel";
import { ReportPanel } from "../components/report/ReportSheet";
import { Dialog } from "../components/ui/Dialog";
import { Sheet } from "../components/ui/Sheet";
import { Tabs } from "../components/ui/Tabs";
import { useData } from "../data/DataProvider";
import type { HealthView } from "../data/health";
import { useSelection } from "../state/selection";
import { useUi } from "../state/ui";
import { useLayout, useMediaQuery } from "../theme/useTheme";

function FigureColumn({ view, fill }: { view: HealthView; fill: boolean }) {
  return (
    <section aria-label="Body systems" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className={fill ? "flex min-h-0 flex-1 flex-col p-4" : "px-4 py-2"}>
        <BodyStage view={view} fill={fill} />
      </div>
      {/* Tablet and desktop show devices and the status key in the status bar instead. */}
      {!fill && <BodyFooter view={view} />}
    </section>
  );
}

function Trends({ view }: { view: HealthView }) {
  const [key, setKey] = useState<IndicatorKey>("hr");
  const entered = INDICATORS[key].source === "entered";
  const [win, setWin] = useState<ChartWindow>("24h");
  const id = useId();
  const effective = entered && win === "1h" ? "24h" : win;
  return (
    <section aria-label="Trends" className="space-y-3 px-4 py-4">
      <h1 className="type-section">Trends</h1>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="type-label text-muted-foreground">
          Indicator
        </label>
        <div className="relative">
          <select id={id} value={key} onChange={(e) => setKey(e.target.value as IndicatorKey)} className="h-12 w-full appearance-none rounded-md border border-input bg-card pr-10 pl-3 type-body text-foreground">
            {INDICATOR_KEYS.map((k) => (
              <option key={k} value={k}>
                {INDICATORS[k].name}
              </option>
            ))}
          </select>
          <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
      <Tabs
        label="Chart period"
        value={effective}
        onChange={setWin}
        items={[
          { value: "1h", label: "1 h", disabled: entered },
          { value: "24h", label: "24 h" },
          { value: "7d", label: "7 d" },
          { value: "30d", label: "30 d" },
        ]}
      />
      <IndicatorChart astronautId={view.astronaut.id} indicator={key} window={effective} alert={view.alerts.find((a) => a.indicator === key)} height={220} />
    </section>
  );
}

function More() {
  const { setDemoOpen, resetSelection } = useUi();
  const { setAstronautId } = useData();
  const navigate = useNavigate();
  const row = "flex min-h-12 w-full items-center px-4 text-left type-body hover:bg-muted";
  return (
    <section aria-label="More" className="py-4">
      <h1 className="px-4 type-section">More</h1>
      <ul className="mt-3 divide-y divide-border border-y border-border">
        <li>
          <Link to="/crew" className={row}>
            Crew overview
          </Link>
        </li>
        <li>
          <Link to="/learn" className={row}>
            Learn
          </Link>
        </li>
        <li>
          <Link to="/methodology" className={row}>
            Methodology
          </Link>
        </li>
        <li>
          <button type="button" className={row} onClick={() => setDemoOpen(true)}>
            Demo controls
          </button>
        </li>
        <li>
          <button
            type="button"
            className={row}
            onClick={() => {
              resetSelection();
              setAstronautId(null);
              navigate("/");
            }}
          >
            Switch astronaut
          </button>
        </li>
      </ul>
      <p className="px-4 pt-3 type-caption text-subtle-foreground">Simulated data for this demo.</p>
    </section>
  );
}

function Content({ view }: { view: HealthView }) {
  const layout = useLayout();
  const tab = usePhoneTab();
  const wide = useMediaQuery("(min-width: 1140px)");
  const { detailOpen, closeDetail, reportOpen, setReportOpen } = useUi();
  const selection = useSelection(view);
  const title = reportOpen ? "Report to the flight surgeon" : selectionTitle(selection);
  // The report opens as a step inside the panel (or the tablet sheet, or the phone page).
  const panel = reportOpen ? <ReportPanel view={view} /> : <DetailBody view={view} />;
  const panelOpen = detailOpen || reportOpen;
  const closePanel = () => {
    setReportOpen(false);
    closeDetail();
  };

  if (layout === "phone") {
    return (
      <main className="min-w-0 flex-1">
        {tab === "today" && (
          <>
            <h1 className="sr-only">Today</h1>
            <IndicatorList view={view} />
          </>
        )}
        {tab === "body" && <FigureColumn view={view} fill={false} />}
        {tab === "trends" && <Trends view={view} />}
        {tab === "more" && <More />}
        <Dialog open={panelOpen} onOpenChange={(o) => !o && closePanel()} title={title} variant="page">
          {panel}
        </Dialog>
      </main>
    );
  }

  // With enough width the open sheet docks beside the figure instead of covering it.
  const docked = layout === "tablet" && panelOpen && wide;
  return (
    <>
      <main className={clsx("grid min-h-0 flex-1 grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_400px]", docked && "pr-[440px]")}>
        <div className="relative min-h-0 overflow-y-auto border-r border-border">
          <IndicatorList view={view} />
        </div>
        <FigureColumn view={view} fill />
        {layout === "desktop" && (
          <aside aria-label="Details" className="relative flex min-h-0 flex-col border-l border-border px-5 pt-4 pb-3">
            {panel}
          </aside>
        )}
      </main>
      {layout === "tablet" && (
        <Sheet open={panelOpen} onOpenChange={(o) => !o && closePanel()} title="Details" description={title} scrim={false}>
          {panel}
        </Sheet>
      )}
    </>
  );
}

function Guard() {
  const view = useCurrentHealth();
  return view ? <Content view={view} /> : null;
}

export default function MyHealth() {
  return (
    <AppShell fixed strip>
      <Guard />
    </AppShell>
  );
}
