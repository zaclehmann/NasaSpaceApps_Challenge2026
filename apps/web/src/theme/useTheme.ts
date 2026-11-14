// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Theme: system, light or dark. During the crew sleep period "system" becomes dark (ui.md 4.5).
import { useCallback, useEffect, useState } from "react";

export type ThemeChoice = "system" | "light" | "dark";
const KEY = "missionvitals.theme";
const listeners = new Set<(c: ThemeChoice) => void>();

function read(): ThemeChoice {
  try {
    const p = new URLSearchParams(window.location.search).get("theme");
    if (p === "light" || p === "dark") return p;
    const v = window.localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // Fall through to the default.
  }
  return "system";
}

let current: ThemeChoice | undefined;

export function useThemeChoice(): [ThemeChoice, (c: ThemeChoice) => void] {
  const [choice, setChoice] = useState<ThemeChoice>(() => (current ??= read()));
  useEffect(() => {
    listeners.add(setChoice);
    return () => {
      listeners.delete(setChoice);
    };
  }, []);
  const set = useCallback((c: ThemeChoice) => {
    current = c;
    try {
      window.localStorage.setItem(KEY, c);
    } catch {
      // The choice lasts for this session only.
    }
    listeners.forEach((l) => l(c));
  }, []);
  return [choice, set];
}

/** Applies the theme to the document. Returns whether dark is active. */
export function useApplyTheme(sleepPeriod: boolean): boolean {
  const [choice] = useThemeChoice();
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSystemDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const dark = choice === "dark" || (choice === "system" && (sleepPeriod || systemDark));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return dark;
}

export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

/** desktop: three columns. tablet: two columns and a sheet. phone: bottom tabs. */
export function useLayout(): "desktop" | "tablet" | "phone" {
  const desktop = useMediaQuery("(min-width: 1280px)");
  const tablet = useMediaQuery("(min-width: 768px)");
  return desktop ? "desktop" : tablet ? "tablet" : "phone";
}

export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
