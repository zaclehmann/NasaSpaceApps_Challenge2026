// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Returns focus to whatever opened an overlay when it closes (ui.md 11).
import { useRef } from "react";

export function useReturnFocus(open: boolean) {
  const opener = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current) opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  wasOpen.current = open;
  return (e: Event) => {
    const el = opener.current;
    if (el && el.isConnected && el !== document.body) {
      e.preventDefault();
      el.focus();
    }
  };
}
