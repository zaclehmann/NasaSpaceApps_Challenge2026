// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Numeric input (ui.md 8): label above, 28 px value, unit fixed inside on the right.
import clsx from "clsx";
import { useId } from "react";

interface Props {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoFocus?: boolean;
}

export function NumericInput({ label, unit, value, onChange, error, autoFocus }: Props) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="type-label text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
          className={clsx(
            "h-16 w-full rounded-md border bg-card pl-4 pr-20 text-[28px] leading-9 font-semibold tabular-nums text-foreground outline-none",
            "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
            error ? "border-warning" : "border-input",
          )}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center type-label text-muted-foreground">{unit}</span>
      </div>
      {error && (
        <p id={errId} className="type-small text-warning-text">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="type-label text-muted-foreground">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-md border border-input bg-card px-3 py-2 type-small text-foreground outline-none placeholder:text-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
      />
    </div>
  );
}
