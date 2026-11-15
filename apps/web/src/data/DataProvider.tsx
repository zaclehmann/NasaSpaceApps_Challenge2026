// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// React context and hooks over a DataSource. Components use these hooks, never the mock itself.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Astronaut, Mission } from "@missionvitals/shared";
import type { DataSource } from "./DataSource";
import { mockSource } from "./mockSource";
import { buildHealth, type HealthView } from "./health";
import { applyUrlParams } from "./urlParams";

interface DataContextValue {
  source: DataSource;
  version: number;
  astronautId: string | null;
  setAstronautId: (id: string | null) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

/**
 * `initial` is the source pickSource chose (the onboard server or the in-browser simulator). `fallback`, when it
 * fires, swaps to the simulator for the rest of the visit: the server stopped answering.
 */
export function DataProvider({ source: initial = mockSource, fallback, children }: { source?: DataSource; fallback?: { subscribe: (cb: () => void) => void }; children: ReactNode }) {
  const [source, setSource] = useState<DataSource>(initial);
  useEffect(() => fallback?.subscribe(() => setSource(mockSource)), [fallback]);
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
