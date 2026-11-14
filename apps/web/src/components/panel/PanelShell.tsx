// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// One layout for everything that opens in the right panel: a reading, a body region, a body part, the report.
//   Header (fixed): a back link to where the item belongs, the name, its status, one main action, a short summary.
//   Tabs: Now (what is wrong and what to do), Trend (the evidence over time), About (background and sources).
//   Body: scrolls on its own, so the header and the actions stay in view. It is position: relative so
//   screen-reader-only text scrolls with its content instead of stretching the page.
//   Footer (fixed): the actions that apply whatever tab is open.
// An alert always opens on Now. The panel never needs a second screen to answer "what do I do".
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Tabs } from "../ui/Tabs";

export interface PanelTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface Props {
  title: string;
  icon?: ReactNode;
  /** Where the item belongs, e.g. "Heart and circulation" above Heart rate. */
  back?: { label: string; onClick: () => void };
  /** Status badge or similar, on the right of the line under the title. */
  status?: ReactNode;
  /** Small context on the left of that line, e.g. "Skeleton view". */
  kicker?: ReactNode;
  /** The one main action for this item. */
  primary?: ReactNode;
  /** The value, the status sentence, or a one-line description. */
  summary?: ReactNode;
  tabs?: PanelTab[];
  /** Content when there are no tabs (the report). */
  children?: ReactNode;
  footer?: ReactNode;
}

export function PanelShell({ title, icon, back, status, kicker, primary, summary, tabs, children, footer }: Props) {
  const [tab, setTab] = useState(tabs?.[0]?.id ?? "");
  const panelId = useId();
  const current = tabs?.find((t) => t.id === tab) ?? tabs?.[0];
  return (
    <article aria-label={title} className="flex h-full min-h-0 flex-col">
      <header className="shrink-0">
        {back && (
          <button
            type="button"
            onClick={back.onClick}
            className="relative -ml-0.5 mb-1 inline-flex items-center gap-1 type-caption text-muted-foreground hover:text-foreground max-xl:before:absolute max-xl:before:inset-x-0 max-xl:before:-inset-y-3.5 max-xl:before:content-['']"
          >
            <ArrowLeft size={13} strokeWidth={1.75} aria-hidden="true" />
            {back.label}
          </button>
        )}
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex min-w-0 items-center gap-2 type-section">
            {icon}
            <span className="min-w-0">{title}</span>
          </h2>
          {primary}
        </div>
        {(status || kicker) && (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 type-small">
            <span className="min-w-0">{status}</span>
            {kicker && <span className="type-caption text-subtle-foreground">{kicker}</span>}
          </div>
        )}
        {summary && <div className="mt-2">{summary}</div>}
      </header>

      {tabs && tabs.length > 1 && (
        <Tabs label={`${title} sections`} items={tabs.map((t) => ({ value: t.id, label: t.label }))} value={current?.id ?? ""} onChange={setTab} className="mt-3 shrink-0 border-b border-border" />
      )}

      <div
        id={panelId}
        role={tabs ? "tabpanel" : undefined}
        aria-label={tabs ? current?.label : undefined}
        tabIndex={tabs ? 0 : undefined}
        className={clsx("relative min-h-0 flex-1 overflow-y-auto focus-visible:outline-offset-[-2px]", tabs && tabs.length > 1 ? "pt-4 pb-4" : "pt-3 pb-4")}
      >
        {tabs ? current?.content : children}
      </div>

      {footer && <div className="shrink-0 border-t border-border pt-3">{footer}</div>}
    </article>
  );
}

/** A titled block inside a tab. */
export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <h3 className="type-small font-semibold">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}
