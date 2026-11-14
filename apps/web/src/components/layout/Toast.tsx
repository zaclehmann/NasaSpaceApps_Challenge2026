// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Toast (ui.md 8): one line, 4 seconds, confirmations only.
// Bottom centre, not bottom right: the right edge holds the panel and the sheets, and a toast there covered their buttons.
import { useUi } from "../../state/ui";

export function Toast() {
  const { toast } = useUi();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center md:bottom-5">
      {toast && <div className="anim-dialog rounded-md bg-card px-4 py-3 type-small font-medium text-foreground shadow-float">{toast}</div>}
    </div>
  );
}
