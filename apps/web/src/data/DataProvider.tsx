// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// React context and hooks over a DataSource. Components use these hooks, never the mock itself.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SCENARIOS, type Astronaut, type Mission, type ScenarioId } from "@missionvitals/shared";
import type { DataSource } from "./DataSource";
import { mockSource } from "./mockSource";
import { buildHealth, type HealthView } from "./health";

interface DataContextValue {
  source: DataSource;
  version: number;
  astronautId: string | null;
  setAstronautId: (id: string | null) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

/** Optional demo links: ?astronaut=hana&scenario=low-spo2 */
function applyUrlParams(source: DataSource): string | null {
  const p = new URLSearchParams(window.location.search);
  const astronaut = p.get("astronaut");
  const scenario = p.get("scenario") as ScenarioId | null;
  const crew = source.getCrew();
  const validAstronaut = astronaut && crew.some((c) => c.id === astronaut) ? astronaut : null;
  if (scenario && SCENARIOS.some((s) => s.id === scenario)) source.setScenario(scenario, validAstronaut ?? source.getMission().scenarioTarget);
  return validAstronaut;
}

export function DataProvider({ source = mockSource, children }: { source?: DataSource; children: ReactNode }) {
  const [version, setVersion] = useState(0);
  // Every load starts at "Who's checking in?". Only a demo link (?astronaut=) opens someone directly.
  const [astronautId, setId] = useState<string | null>(() => applyUrlParams(source));
  useEffect(() => source.subscribe(() => setVersion((v) => v + 1)), [source]);
  const setAstronautId = useCallback((id: string | null) => setId(id), []);
  const value = useMemo(() => ({ source, version, astronautId, setAstronautId }), [source, version, astronautId, setAstronautId]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}

export function useSource(): DataSource {
  return useData().source;
}

export function useMission(): Mission {
  const { source, version } = useData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => source.getMission(), [source, version]);
}

export function useCrew(): Astronaut[] {
  return useData().source.getCrew();
}

/** The astronaut whose data is on screen, or null before one is chosen. */
export function useAstronaut(): Astronaut | null {
  const { source, astronautId } = useData();
  return source.getCrew().find((c) => c.id === astronautId) ?? null;
}

export function useHealth(astronaut: Astronaut): HealthView {
  const { source, version } = useData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => buildHealth(source, astronaut), [source, version, astronaut]);
}

export function useCrewHealth(): HealthView[] {
  const { source, version } = useData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => source.getCrew().map((a) => buildHealth(source, a)), [source, version]);
}
