// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// On/off switch. Selection uses foreground, never a status colour (ui.md 3.3 rule 3).
import clsx from "clsx";
import { useId } from "react";

export function Switch({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 py-2">
      <span className="min-w-0">
        <span id={id} className="block type-small font-medium">
          {label}
        </span>
        {description && <span className="block type-caption text-subtle-foreground">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className={clsx("relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-[120ms] before:absolute before:-inset-3 before:content-['']", checked ? "border-foreground bg-foreground" : "border-border-strong bg-card")}
      >
        <span className={clsx("absolute top-1 left-1 size-[18px] rounded-full transition-transform duration-[120ms]", checked ? "translate-x-5 bg-background" : "bg-muted-foreground")} />
      </button>
    </div>
  );
}
