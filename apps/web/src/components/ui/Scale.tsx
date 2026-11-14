// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// 1 to 5 scale (ui.md 8): five joined buttons with word labels, no faces.
import clsx from "clsx";
import { useId } from "react";

interface Props {
  legend: string;
  labels: readonly string[];
  value: number | null;
  onChange: (v: number) => void;
}

export function Scale({ legend, labels, value, onChange }: Props) {
  const id = useId();
  return (
    <div className="min-w-0">
      <p id={id} className="mb-2 type-body font-medium text-foreground">
        {legend}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="flex w-full">
        {labels.map((label, i) => {
          const v = i + 1;
          const on = value === v;
          return (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(v)}
              className={clsx(
                "relative -ml-px flex min-h-12 min-w-0 flex-1 items-center justify-center border px-1 text-center type-small first:ml-0 first:rounded-l-md last:rounded-r-md focus-visible:z-10",
                on ? "z-[1] border-foreground bg-foreground font-medium text-background" : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
