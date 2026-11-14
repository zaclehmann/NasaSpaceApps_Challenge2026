// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Custom status badges (ui.md 3.2): circle-check, circle-i, triangle-!, octagon-!, dashed circle-minus.
import clsx from "clsx";
import { STATUS_WORD, type Status } from "@missionvitals/shared";
import { STATUS_TEXT } from "./statusStyles";

const OCTAGON = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = ((22.5 + i * 45) * Math.PI) / 180;
    pts.push(`${(8 + 7.6 * Math.cos(a)).toFixed(2)},${(8 + 7.6 * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
})();

/** The badge drawn in a 16 x 16 box. Use inside any SVG. "Due" is neutral and has no badge. */
export function BadgeShape({ status }: { status: Status }) {
  const glyph = "var(--glyph-on-status)";
  const g = { strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  switch (status) {
    case "ok":
      return (
        <g>
          <circle cx="8" cy="8" r="7.5" fill="var(--ok)" />
          <path d="M4.7 8.3 L7 10.6 L11.3 5.8" stroke={glyph} {...g} />
        </g>
      );
    case "watch":
      return (
        <g>
          <circle cx="8" cy="8" r="7.5" fill="var(--watch)" />
          <circle cx="8" cy="4.8" r="1.1" fill={glyph} />
          <path d="M8 7.4 V11.6" stroke={glyph} {...g} />
        </g>
      );
    case "caution":
      return (
        <g>
          <path d="M8 1.3 L15 14.3 H1 Z" fill="var(--caution)" stroke="var(--caution)" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M8 6 V9.6" stroke="var(--glyph-on-caution)" {...g} />
          <circle cx="8" cy="12" r="1" fill="var(--glyph-on-caution)" />
        </g>
      );
    case "warning":
      return (
        <g>
          <polygon points={OCTAGON} fill="var(--warning)" />
          <path d="M8 4.3 V8.9" stroke={glyph} {...g} />
          <circle cx="8" cy="11.4" r="1.05" fill={glyph} />
        </g>
      );
    case "due":
      return null;
    case "nodata":
      return (
        <g>
          <circle cx="8" cy="8" r="6.8" fill="none" stroke="var(--nodata)" strokeWidth="1.5" strokeDasharray="3 2.34" />
          <path d="M5.3 8 H10.7" stroke="var(--nodata)" {...g} strokeWidth={1.6} />
        </g>
      );
  }
}

export function BadgeIcon({ status, size = 16, className }: { status: Status; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={clsx("shrink-0", className)}>
      <BadgeShape status={status} />
    </svg>
  );
}

export function StatusWord({ status, className }: { status: Status; className?: string }) {
  return <span className={clsx(STATUS_TEXT[status], "font-medium", className)}>{STATUS_WORD[status]}</span>;
}

/** Badge with its word. The word is always printed (ui.md 3.3 rule 6). */
export function StatusBadge({ status, className, wordClassName }: { status: Status; className?: string; wordClassName?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <BadgeIcon status={status} />
      <StatusWord status={status} className={wordClassName} />
    </span>
  );
}
