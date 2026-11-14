// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Token class and variable lookups per status. Full class strings so Tailwind can see them.
import type { Status } from "@missionvitals/shared";

export const STATUS_TEXT: Record<Status, string> = {
  ok: "text-ok-text",
  watch: "text-watch-text",
  caution: "text-caution-text",
  warning: "text-warning-text",
  nodata: "text-nodata-text",
  due: "text-muted-foreground",
};

/** Row and region tint, Watch and above only (ui.md 3.2). */
export const STATUS_TINT: Record<Status, string> = {
  ok: "",
  watch: "bg-watch-tint",
  caution: "bg-caution-tint",
  warning: "bg-warning-tint",
  nodata: "",
  due: "",
};

/** Badge colour as a CSS variable, for SVG and charts. */
export const STATUS_VAR: Record<Status, string> = {
  ok: "var(--ok)",
  watch: "var(--watch)",
  caution: "var(--caution)",
  warning: "var(--warning)",
  nodata: "var(--nodata)",
  due: "var(--muted-foreground)",
};

export const TINT_VAR: Record<Status, string> = {
  ok: "var(--figure)",
  watch: "var(--watch-tint)",
  caution: "var(--caution-tint)",
  warning: "var(--warning-tint)",
  nodata: "var(--figure)",
  due: "var(--figure)",
};

export const isAlerting = (s: Status) => s === "watch" || s === "caution" || s === "warning";
