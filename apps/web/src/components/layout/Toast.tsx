// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Toast (ui.md 8): bottom right, one line, 4 seconds, confirmations only.
import { useUi } from "../../state/ui";

export function Toast() {
  const { toast } = useUi();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-20 z-[60] md:bottom-4">
      {toast && <div className="anim-dialog rounded-md bg-card px-4 py-3 type-small font-medium text-foreground shadow-float">{toast}</div>}
    </div>
  );
}
