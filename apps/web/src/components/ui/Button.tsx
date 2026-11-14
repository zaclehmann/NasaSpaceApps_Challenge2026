// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Buttons (ui.md 8): primary, secondary, text.
// md: 40 px on desktop, 48 px on tablet and phone. sm: a compact 32 px button whose touch target
// still reaches 48 px on tablet and phone, through an invisible extension above and below.
import clsx from "clsx";
import type { ButtonHTMLAttributes, Ref } from "react";

export type ButtonVariant = "primary" | "secondary" | "text";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  ref?: Ref<HTMLButtonElement>;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-85",
  secondary: "bg-card text-foreground border border-border hover:bg-muted",
  text: "text-foreground hover:underline underline-offset-4",
};

export function Button({ variant = "secondary", size = "md", className, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={clsx(
        "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-[120ms]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "min-h-12 type-small xl:min-h-10" : "h-8 type-small max-xl:h-9 max-xl:before:absolute max-xl:before:inset-x-0 max-xl:before:-inset-y-1.5 max-xl:before:content-['']",
        variant === "text" ? "px-1" : size === "md" ? "px-4" : "px-3",
        VARIANT[variant],
        className,
      )}
      {...rest}
    />
  );
}
