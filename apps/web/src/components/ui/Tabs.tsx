// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Tabs and segmented control (ui.md 8): text items; selected = 600 weight and 2 px underline.
import clsx from "clsx";
import { useRef } from "react";

interface Props<T extends string> {
  label: string;
  items: readonly { value: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ label, items, value, onChange, className }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = items.filter((i) => !i.disabled);
  const move = (dir: 1 | -1) => {
    const idx = enabled.findIndex((i) => i.value === value);
    const next = enabled[(idx + dir + enabled.length) % enabled.length];
    onChange(next.value);
    refs.current[items.indexOf(next)]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={clsx("flex gap-4", className)}>
      {items.map((item, i) => {
        const on = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") move(1);
              if (e.key === "ArrowLeft") move(-1);
            }}
            className={clsx(
              "min-h-12 xl:min-h-9 border-b-2 type-small disabled:cursor-not-allowed disabled:text-subtle-foreground",
              on ? "border-foreground font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
