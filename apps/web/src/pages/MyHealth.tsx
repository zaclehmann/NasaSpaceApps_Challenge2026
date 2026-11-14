// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// My Health (ui.md 5.2): my numbers, where in my body, what to do.
// Desktop: three columns. Tablet: two columns, summary strip and a right sheet. Phone: bottom tabs and full pages.
import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { INDICATORS, INDICATOR_KEYS, type ChartWindow, type IndicatorKey } from "@missionvitals/shared";
import { BodyFigure } from "../components/body/BodyFigure";
import { BodyLegend } from "../components/body/BodyLegend";
import { DeviceLine } from "../components/body/DeviceLine";
import { IndicatorChart } from "../components/charts/IndicatorChart";
import { IndicatorList } from "../components/indicators/IndicatorList";
import { AppShell, useCurrentHealth } from "../components/layout/AppShell";
import { usePhoneTab } from "../components/layout/BottomTabs";
import { RoutineBar } from "../components/layout/RoutineBar";
import { AttentionList, DetailBody, selectionTitle } from "../components/panel/DetailPanel";
import { SummarySentence } from "../components/panel/SummarySentence";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { Sheet } from "../components/ui/Sheet";
import { Tabs } from "../components/ui/Tabs";
import { useData } from "../data/DataProvider";
import type { HealthView } from "../data/health";
import { useSelection } from "../state/selection";
import { useUi } from "../state/ui";
import { useLayout } from "../theme/useTheme";

function FigureColumn({ view }: { view: HealthView }) {
  return (
    <section aria-label="Body systems" className="flex min-h-0 min-w-0 flex-1 flex-col items-center gap-4 px-4 py-4 md:py-6">
      <div className="flex min-h-0 w-full flex-1 justify-center max-md:h-[62dvh] max-md:flex-none">
        <BodyFigure view={view} />
      </div>
      <BodyLegend />
      <DeviceLine view={view} />
      <p className="type-caption text-subtle-foreground">Simulated data. Demo thresholds.</p>
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
    <section aria-label="Trends" className="space-y-4 px-4 py-4">
      <h1 className="type-title">Trends</h1>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="type-label text-muted-foreground">
          Indicator
        </label>
        <select id={id} value={key} onChange={(e) => setKey(e.target.value as IndicatorKey)} className="h-12 rounded-md border border-input bg-card px-3 type-body text-foreground">
          {INDICATOR_KEYS.map((k) => (
            <option key={k} value={k}>
              {INDICATORS[k].name}
            </option>
          ))}
        </select>
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
      <IndicatorChart astronautId={view.astronaut.id} indicator={key} window={effective} alert={view.alerts.find((a) => a.indicator === key)} />
    </section>
  );
}

function More() {
  const { setDemoOpen, resetSelection } = useUi();
  const { setAstronautId } = useData();
  const navigate = useNavigate();
  const row = "flex min-h-14 w-full items-center px-4 text-left type-body hover:bg-muted";
  return (
    <section aria-label="More" className="py-4">
      <h1 className="px-4 type-title">More</h1>
      <ul className="mt-4 divide-y divide-border border-y border-border">
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
      <p className="px-4 pt-4 type-caption text-subtle-foreground">Simulated data for this demo.</p>
    </section>
  );
}

function Content() {
  const view = useCurrentHealth();
  const layout = useLayout();
  const tab = usePhoneTab();
  const { detailOpen, closeDetail, openDetail } = useUi();
  const selection = useSelection(view!);
  if (!view) return null;
  const title = selectionTitle(selection);

  if (layout === "phone") {
    return (
      <main className="min-w-0 flex-1">
        {tab === "today" && (
          <>
            <div className="space-y-2 px-4 pt-4">
              <h1 className="sr-only">Today</h1>
              <SummarySentence view={view} />
              <AttentionList view={view} />
              <RoutineBar view={view} variant="inline" />
            </div>
            <IndicatorList view={view} showTitle={false} />
          </>
        )}
        {tab === "body" && <FigureColumn view={view} />}
        {tab === "trends" && <Trends view={view} />}
        {tab === "more" && <More />}
        <Dialog open={detailOpen} onOpenChange={(o) => !o && closeDetail()} title={title} variant="page">
          <DetailBody view={view} />
        </Dialog>
      </main>
    );
  }

  return (
    <>
      <RoutineBar view={view} />
      {layout === "tablet" && (
        <div className="flex items-center gap-4 border-b border-border px-4 py-2">
          <SummarySentence view={view} className="min-w-0 flex-1" />
          <Button onClick={openDetail}>Open</Button>
        </div>
      )}
      <main className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_400px]">
        <div className="min-h-0 overflow-y-auto border-r border-border">
          <IndicatorList view={view} />
        </div>
        <FigureColumn view={view} />
        {layout === "desktop" && (
          <aside aria-label="Details" className="min-h-0 space-y-3 overflow-y-auto py-4 pr-4">
            <SummarySentence view={view} />
            <AttentionList view={view} />
            <div className="rounded-lg border border-border bg-card p-5">
              <DetailBody view={view} />
            </div>
          </aside>
        )}
      </main>
      {layout === "tablet" && (
        <Sheet open={detailOpen} onOpenChange={(o) => !o && closeDetail()} title="Details" description={title} scrim={false}>
          <div className="pt-2">
            <DetailBody view={view} />
          </div>
        </Sheet>
      )}
    </>
  );
}

export default function MyHealth() {
  return (
    <AppShell fixed>
      <Content />
    </AppShell>
  );
}
