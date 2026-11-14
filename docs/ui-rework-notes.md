<!-- AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann. -->
# UI rework notes, 14 Nov 2026

After the first build, a strict UI audit found 58 problems. Zac asked for them to be fixed, with less card and badge use, a compact but information-rich layout, real workflows, and a neat human outline. This file records what changed and where the app now differs from `ui.md`. Where they disagree, this file describes what is built.

## What changed

| Area | Before | Now |
| --- | --- | --- |
| Body figure | Rectangles, discs and a capsule ring | One smooth outline. Regions are cut from it, so their edges follow the body. A hairline contour keeps it visible in dark mode. |
| Region labels | None; hover tooltip only | Each region has a label on a leader line with its live readings. In a narrow column or on phone they become a list under the figure. |
| Whole body | A capsule around the figure | A halo that follows the outline, shown only when radiation needs attention or the region is highlighted. |
| Chrome | Header, routine bar, warning bar and summary strip: up to four bars | Header (48 px) and one status strip. An unacknowledged Warning turns the strip into the Warning bar. |
| Summary | Sentence in the panel, repeated in the warning bar | One sentence in the strip. Indicator names in it are links. |
| Routine | A bar with segments and a popover | A full task list under the indicators, plus "Next check" and Start in the strip. |
| Indicator rows | 64 px, badge and "In range" on every row, trend arrow | 48 px, sparkline, aligned value and unit columns. A status mark and word only when the row needs attention. |
| Panel | A bordered card with six buttons | A plain column: number, status line, facts, a checklist, then the chart. |
| Alert response | Static steps plus four log buttons | Steps are a checklist; ticking one records its time. One "Log action" menu. A reading taken during an alert is logged as the re-measure. |
| Procedure | Ended on Done | The result step names the next due routine task and offers "Start next". |
| Charts | Wide axis, colliding labels, fuzzy line | Tight scale with round ticks, at most 150 points per line, no label on the latest value. |
| Buttons | Three heights; 48 px tall on tablet | Compact buttons are 32 to 36 px tall; an invisible extension keeps the touch target at 48 px. |
| Learn | One long template repeated five times | One row per hazard: text on the left, risks, readings and regions on the right. |
| Crew table | Rows of different heights | Role sits under the name; status sits beside the value. |

## Where the app now differs from ui.md

- **5.2 header.** Height is 48 px, not 56. Page links sit beside the product name. Demo is a text button.
- **5.2 routine bar.** Replaced by the task list and the status strip. There are no progress segments.
- **5.2 indicator rows.** No badge or "In range" word on in-range rows, and no trend arrow. The sparkline shows the trend, and a hidden label still says "In range, steady" for screen readers. Rule 3.3.6 (the word is always beside the badge) still holds everywhere a badge appears.
- **5.2 panel.** The summary sentence is in the strip, not at the top of the panel. "Also watching" is part of the same sentence. The panel has no border or radius.
- **5.3 order.** Unchanged: status, number, action, trend, explanation. A facts list was added after the status line.
- **5.6 action log.** "I re-measured", "Checked the sensor", "Contacted the CMO" and "Add note" are in one menu. Entered readings log the re-measure by themselves.
- **6.1 drawing.** The figure has a 1 px contour in `--border-strong`. The spec says no outline; the fill alone was too faint, most of all in dark mode.
- **6.2 whole body.** A halo that follows the outline, not a ring around the figure, and hidden while in range.
- **6.4 focus.** The labels are the focusable buttons. The shapes on the figure are pointer targets only, so each region has one tab stop.
- **7 charts.** The demo band is named in the caption above the chart, not inside the band. The latest value is not labelled on the chart; it is the large number above it.
- **8 toast.** Bottom centre, not bottom right, so it never covers the panel or a sheet.
- **12 tablet.** From 1140 px wide, an open detail sheet docks beside the figure instead of covering it.
- **5.10 Learn.** The page is up to 960 px wide to fit two columns. Each text column stays under 70 characters.
- **Placeholders.** `TODO(Zac)` notes and the `/kit` route appear only under `npm run dev`.

## Audit items not changed

- **Row tints in light mode** stay as the spec's tokens, which are close to the page colour. Rows now rely on the mark, word and coloured value.
- **Report thumbnails** still have no axis. They are a glance, and the full chart is one tap away.
- **Eyes and inner ear** still have no reading. Bones and muscles now shows the exercise log task.
