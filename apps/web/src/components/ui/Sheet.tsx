// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Right sheet (ui.md 8): 440 px, card fill, radius 12 on the inner corners, shadow-float.
// Built on Radix Dialog: focus is trapped, Escape closes, focus returns to the opener.
import * as RD from "@radix-ui/react-dialog";
import clsx from "clsx";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useReturnFocus } from "./useReturnFocus";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Dim the page behind. Off for the detail sheet so the figure stays readable. */
  scrim?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, title, description, scrim = true, footer, children }: Props) {
  const returnFocus = useReturnFocus(open);
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className={clsx("fixed inset-0 z-40", scrim && "anim-scrim bg-scrim")} />
        <RD.Content onCloseAutoFocus={returnFocus}
          onOpenAutoFocus={(e) => {
            // Focus the panel itself, not its close button, so nothing looks selected on open.
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }} className="anim-sheet fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-card text-foreground shadow-float outline-none sm:rounded-l-xl">
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
            <div className="min-w-0">
              <RD.Title className="type-section">{title}</RD.Title>
              {description ? <RD.Description className="type-small text-muted-foreground">{description}</RD.Description> : <RD.Description className="sr-only">{title}</RD.Description>}
            </div>
            <RD.Close className="-mr-3 -mt-2 flex size-12 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
              <X size={20} strokeWidth={1.5} aria-hidden="true" />
            </RD.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
          {footer && <div className="border-t border-border px-6 py-4">{footer}</div>}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
