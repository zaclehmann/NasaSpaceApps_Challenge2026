// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Status bar along the bottom of the window, in the manner of the VS Code status bar: one thin row of
// small items. Left: each device and when it last reported; click one to open its reading. Right: the
// data notice and the status key, which opens upward. Tablet and desktop only; phone keeps the legend
// under the figure (BodyFooter) because the bottom tabs already hold that edge.
import * as Popover from "@radix-ui/react-popover";
import clsx from "clsx";
import { CircleHelp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { STATUSES, type IndicatorKey, type Status } from "@missionvitals/shared";
import { deviceStates } from "../../data/devices";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { DEVICE_ICON } from "../indicators/icons";
import { BadgeIcon, StatusBadge } from "../status/StatusBadge";

const MEANING: Record<Exclude<Status, "due">, string> = {
  ok: "Inside your demo range.",
  watch: "In range but trending toward a limit, or a check is overdue.",
  caution: "Outside the demo range. Needs attention, not immediate action.",
  warning: "Outside the critical demo range. Act now.",
  nodata: "A live sensor is silent, or a daily measurement wasn't done by the end of the day.",
};

/** One status bar item: full bar height, a hover fill, no border. */
const item = "flex h-full shrink-0 items-center gap-1.5 px-2 whitespace-nowrap hover:bg-muted hover:text-foreground";

export function StatusBar({ view }: { view: HealthView }) {
  const { select } = useUi();
  const navigate = useNavigate();
  const open = (key: IndicatorKey) => {
    navigate("/");
    select({ kind: "indicator", key });
  };
  return (
    <footer aria-label="Status bar" className="sticky bottom-0 z-20 flex h-7 shrink-0 items-stretch justify-between border-t border-border bg-background px-2 type-caption text-muted-foreground max-md:hidden max-xl:h-9">
      <ul aria-label="Devices" className="flex min-w-0 items-stretch overflow-hidden">
        {deviceStates(view).map((d) => {
          const Icon = DEVICE_ICON[d.id];
          return (
            <li key={d.id} className="flex">
              <button
                type="button"
                title={`${d.tip}: ${d.state}. Open the reading.`}
                onClick={() => open(d.opens)}
                className={clsx(item, d.silent && "font-medium text-nodata-text")}
              >
                {d.silent ? <BadgeIcon status="nodata" size={12} /> : <Icon size={13} strokeWidth={1.5} aria-hidden="true" />}
                <span className={clsx(!d.silent && "text-foreground")}>{d.name}</span>
                <span className="tabular-nums">{d.state}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex shrink-0 items-stretch">
        <span className={clsx(item, "hover:bg-transparent hover:text-muted-foreground max-lg:hidden")}>Simulated data, demo thresholds</span>
        <Popover.Root>
          <Popover.Trigger className={clsx(item, "data-[state=open]:bg-muted data-[state=open]:text-foreground")}>
            <CircleHelp size={13} strokeWidth={1.5} aria-hidden="true" />
            Status key
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content side="top" align="end" sideOffset={6} collisionPadding={8} className="z-50 w-80 rounded-lg border border-border bg-card p-1.5 text-foreground shadow-float outline-none">
              <p className="px-2.5 pt-1.5 pb-1 type-caption font-medium text-subtle-foreground">Status key</p>
              <ul aria-label="Status key">
                {STATUSES.filter((s): s is Exclude<Status, "due"> => s !== "due").map((s) => (
                  <li key={s} className="flex flex-col gap-0.5 rounded-md px-2.5 py-1.5">
                    <StatusBadge status={s} />
                    <span className="pl-[22px] type-caption text-muted-foreground">{MEANING[s]}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 border-t border-border px-2.5 pt-2 pb-1.5 type-caption text-subtle-foreground">All limits are demo values, not medical advice.</p>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </footer>
  );
}
