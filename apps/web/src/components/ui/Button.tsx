// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Buttons (ui.md 8): primary, secondary, text. 40 px on desktop, 48 px on tablet and phone.
import clsx from "clsx";
import type { ButtonHTMLAttributes, Ref } from "react";

export type ButtonVariant = "primary" | "secondary" | "text";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  ref?: Ref<HTMLButtonElement>;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground px-4 hover:opacity-85",
  secondary: "bg-card text-foreground border border-border px-4 hover:bg-muted",
  text: "text-foreground px-1 hover:underline underline-offset-4",
};

export function Button({ variant = "secondary", size = "md", className, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md type-small font-medium whitespace-nowrap transition-colors duration-[120ms]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "min-h-12 xl:min-h-10" : "min-h-12 xl:min-h-8",
        size === "sm" && variant !== "text" && "px-3",
        VARIANT[variant],
        className,
      )}
      {...rest}
    />
  );
}
