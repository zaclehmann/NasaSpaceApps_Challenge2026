// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Dialog (ui.md 8): up to 560 px, centred, radius 12, shadow-float, scrim. Full screen on phone.
// "page" variant: a full page with a back button, used for details on phone (ui.md 5.2).
import * as RD from "@radix-ui/react-dialog";
import clsx from "clsx";
import { ArrowLeft, X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Shown under the title, e.g. "Step 1 of 3". */
  subtitle?: string;
  variant?: "dialog" | "page";
  footer?: ReactNode;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, subtitle, variant = "dialog", footer, children }: Props) {
  const page = variant === "page";
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        {!page && <RD.Overlay className="anim-scrim fixed inset-0 z-40 bg-scrim" />}
        <RD.Content
          className={clsx(
            "fixed z-50 flex flex-col text-foreground outline-none",
            page
              ? "inset-0 bg-background"
              : "anim-dialog inset-0 bg-card md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[calc(100dvh-48px)] md:w-[560px] md:max-w-[calc(100vw-48px)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:shadow-float",
          )}
        >
          {page ? (
            <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-2">
              <RD.Close className="flex h-12 items-center gap-2 rounded-md px-2 type-small font-medium hover:bg-muted">
                <ArrowLeft size={20} strokeWidth={1.5} aria-hidden="true" />
                Back
              </RD.Close>
              <RD.Title className="sr-only">{title}</RD.Title>
              <RD.Description className="sr-only">{subtitle ?? title}</RD.Description>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
              <div className="min-w-0">
                <RD.Title className="type-section">{title}</RD.Title>
                <RD.Description className={subtitle ? "type-small text-muted-foreground" : "sr-only"}>{subtitle ?? title}</RD.Description>
              </div>
              <RD.Close className="-mr-3 -mt-2 flex size-12 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
                <X size={20} strokeWidth={1.5} aria-hidden="true" />
              </RD.Close>
            </div>
          )}
          <div className={clsx("min-h-0 flex-1 overflow-y-auto", page ? "px-4 py-4" : "px-6 pb-6")}>{children}</div>
          {footer && <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
