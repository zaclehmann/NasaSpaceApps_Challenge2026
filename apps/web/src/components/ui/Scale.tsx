// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// 1 to 5 scale (ui.md 8): five joined buttons with word labels, no faces.
// Keyboard, as a standard radio group: one Tab stop (the chosen answer, or the first when none is chosen),
// Left/Right or Up/Down move and choose (wrapping round), Home and End jump to the ends, Space chooses.
import clsx from "clsx";
import { useId, useRef, type KeyboardEvent } from "react";

interface Props {
  legend: string;
  labels: readonly string[];
  value: number | null;
  onChange: (v: number) => void;
}

export function Scale({ legend, labels, value, onChange }: Props) {
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const n = labels.length;
  // The one option in the Tab order.
  const stop = value !== null && value >= 1 && value <= n ? value : 1;
  const choose = (v: number) => {
    onChange(v);
    buttons.current[v - 1]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, v: number) => {
    const next = { ArrowRight: v + 1, ArrowDown: v + 1, ArrowLeft: v - 1, ArrowUp: v - 1, Home: 1, End: n }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    choose(((next - 1 + n) % n) + 1);
  };
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
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={v === stop ? 0 : -1}
              onClick={() => onChange(v)}
              onKeyDown={(e) => onKey(e, v)}
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
