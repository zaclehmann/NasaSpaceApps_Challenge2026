// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Toggle tag (ui.md 8): 32 px tall, radius 16, 1 px border; on = foreground fill.
import clsx from "clsx";

export function ToggleTag({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={clsx(
        "relative inline-flex h-8 items-center rounded-2xl border px-3 type-small",
        "before:absolute before:-inset-y-2 before:inset-x-0 before:content-['']",
        on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
