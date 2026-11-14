// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Interface state shared across the shell: selection, linked hover, open overlays and the toast.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { IndicatorKey, RegionId, RoutineKind } from "@missionvitals/shared";

export type Selection = { kind: "indicator"; key: IndicatorKey } | { kind: "region"; id: RegionId };

export interface ProcedureRequest {
  kind: RoutineKind;
  taskId?: string;
}

interface UiValue {
  /** null means "show the worst item". */
  selection: Selection | null;
  /** Select an item. On tablet and phone this also opens the detail sheet or page. */
  select: (s: Selection) => void;
  detailOpen: boolean;
  openDetail: () => void;
  closeDetail: () => void;
  hoverIndicator: IndicatorKey | null;
  hoverRegion: RegionId | null;
  setHoverIndicator: (k: IndicatorKey | null) => void;
  setHoverRegion: (r: RegionId | null) => void;
  procedure: ProcedureRequest | null;
  startProcedure: (p: ProcedureRequest) => void;
  closeProcedure: () => void;
  reportOpen: boolean;
  setReportOpen: (open: boolean) => void;
  demoOpen: boolean;
  setDemoOpen: (open: boolean) => void;
  toast: string | null;
  showToast: (message: string) => void;
  resetSelection: () => void;
}

const UiContext = createContext<UiValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [hoverIndicator, setHoverIndicator] = useState<IndicatorKey | null>(null);
  const [hoverRegion, setHoverRegion] = useState<RegionId | null>(null);
  const [procedure, setProcedure] = useState<ProcedureRequest | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    clearTimeout(timer.current);
    setToast(message);
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);
  const select = useCallback((s: Selection) => {
    setSelection(s);
    setDetailOpen(true);
  }, []);
  const resetSelection = useCallback(() => {
    setSelection(null);
    setDetailOpen(false);
  }, []);

  const value = useMemo<UiValue>(
    () => ({
      selection,
      select,
      detailOpen,
      openDetail: () => setDetailOpen(true),
      closeDetail: () => setDetailOpen(false),
      hoverIndicator,
      hoverRegion,
      setHoverIndicator,
      setHoverRegion,
      procedure,
      startProcedure: setProcedure,
      closeProcedure: () => setProcedure(null),
      reportOpen,
      setReportOpen,
      demoOpen,
      setDemoOpen,
      toast,
      showToast,
      resetSelection,
    }),
    [selection, select, detailOpen, hoverIndicator, hoverRegion, procedure, reportOpen, demoOpen, toast, showToast, resetSelection],
  );
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used inside UiProvider");
  return ctx;
}
