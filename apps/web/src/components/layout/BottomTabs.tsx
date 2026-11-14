// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Bottom tabs on phone (ui.md 5.2): Today, Body, Trends, More.
import clsx from "clsx";
import { ChartLine, Ellipsis, ListChecks, PersonStanding } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

export type PhoneTab = "today" | "body" | "trends" | "more";

const TABS = [
  { id: "today", label: "Today", icon: ListChecks },
  { id: "body", label: "Body", icon: PersonStanding },
  { id: "trends", label: "Trends", icon: ChartLine },
  { id: "more", label: "More", icon: Ellipsis },
] as const;

export function usePhoneTab(): PhoneTab {
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  if (pathname !== "/") return "more";
  const t = params.get("tab");
  return t === "body" || t === "trends" || t === "more" ? t : "today";
}

export function BottomTabs() {
  const current = usePhoneTab();
  return (
    <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-border bg-background md:hidden">
      {TABS.map((t) => {
        const on = t.id === current;
        const Icon = t.icon;
        return (
          <Link
            key={t.id}
            to={t.id === "today" ? "/" : `/?tab=${t.id}`}
            aria-current={on ? "page" : undefined}
            className={clsx("flex flex-1 flex-col items-center justify-center gap-0.5 type-caption", on ? "font-semibold text-foreground" : "text-muted-foreground")}
          >
            <Icon size={20} strokeWidth={on ? 2 : 1.5} aria-hidden="true" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
