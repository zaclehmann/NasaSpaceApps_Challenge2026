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

## Indicator rule changes, 14 Nov 2026 (second round)

Zac reviewed the indicator list and asked for one new indicator and five rule fixes. All ranges stay demo values.

| Change | Rule now |
| --- | --- |
| Exercise added (indicator 9) | Minutes a day from the shirt's activity sensor, confirmed by the astronaut. In range 120 or more (demo target); Caution 60 to 119, or below 60 once; Warning below 60 on two days running. Region: Bones and muscles. Procedure HM-9, logged at 16:00. |
| Watch margins | A fixed margin inside each limit, not a percentage: heart rate 6 bpm, SpO₂ 1 %, temperature 0.3 °C, systolic 10 and diastolic 5 mmHg, glucose 10 mg/dL, sleep 0.5 h, exercise 15 min, radiation 2 µGy/h. The trend is over the last hour for live readings and the last 3 days for entered ones. |
| Temperature | A thermometer reading entered each morning (07:05, HM-5) and when unwell. The shirt measures skin temperature, which reads below the core-temperature ranges used here. Only heart rate and SpO₂ are live. |
| Glucose | Judged by when it was taken: 70 to 110 mg/dL fasting or before a meal, 70 to 140 mg/dL after a meal. Caution and warning bands unchanged. |
| Due, Overdue, No data | An entered measurement not taken yet is "Due" (plain text, no badge, never makes a region or the overall status worse) until an hour past its time, then Watch ("Overdue"), then No data if the day ends without it. Live sensors keep the 3x interval rule. |
| Low blood pressure | Diastolic below 60 is Caution. |

Knock-on changes: the routine has 7 tasks; scenario 2 logs a 124-minute exercise session before heart rate stays high; scenario 6 now silences heart rate and SpO₂ (the shirt), since temperature no longer comes from it. "Before a meal" glucose uses the fasting range; the rule did not say, and this is the cautious choice.

## Anatomy views, 14 Nov 2026

Zac asked for the body figure to show anatomy, with switchable Organs, Muscles and Skeleton views, a 3D-ish look, and relevant stats in each. `ui.md` sections 2 and 6.1 are updated to match.

- **3D-ish:** SVG lighting filters (blur of the shape's own outline, diffuse and specular light from the upper left) give the body and each organ, bone and muscle soft volume. No WebGL and no model file, so it stays offline and small.
- **Same nine regions in every view.** Each view decides how a region is drawn: as anatomy (an organ, a muscle group, a bone) or as a cut of the outline. Labels, readings and the detail panel are the same in all views; only the bones and muscles label is renamed ("Muscles", "Bones").
- **Stats per view:** the region labels carry the readings, and a line under the view switch gives the ones that matter for that view.
- **Not in scope:** rotating the figure. A real 3D model would need a licensed human mesh and a 3D library.

## Body parts and symptoms, 14 Nov 2026

Zac asked for each anatomy view to show its own parts and let him record problems there (a sore knee, a rib, a stiff back). He chose: tap a named part, front and back views, symptoms change status with demo rules, and privacy like mood.

- **Parts:** 78 named parts in `packages/shared/src/bodyParts.ts`, each in one view: organs (head, eyes, ears, throat, lungs, heart, liver, stomach, intestines, bladder, abdomen, kidneys), muscles (neck, shoulders, chest, arms, abdomen, back, glutes, thighs, hamstrings, calves) and skeleton (skull, spine, collarbones, shoulder blades, ribs, every limb bone and joint). Left and right are the astronaut's own.
- **Front and back:** a switch beside the view tabs. The back shows back muscles, shoulder blades, spine and kidneys.
- **Picking a part:** tap it on the figure (its name shows on hover), or choose it from the "Choose a body part" list, which is the keyboard and screen reader path.
- **Part page:** active symptoms with severity and the demo rule that set their status, what to do, related readings, earlier symptoms, and Log symptom.
- **On the figure:** a part with an active symptom is tinted and edged in its status colour with a small badge. The body-system label shows the status too. Regions are still tinted from readings alone, so a sore knee marks the knee, not every limb.
- **Status:** `HealthView.parts` holds each part's status; a region's status is the worst of its readings and its parts' symptoms, and the overall status includes symptoms.
- The symptom form, the logged-symptoms page and the symptom status rules were built in the other session (`layout/Symptoms.tsx`, `shared/symptoms.ts`).

## Anatomy redraw, 14 Nov 2026

Zac asked for the organs, skeleton and muscles to be drawn accurately. `bodyAnatomy.ts` was redrawn from standard surface anatomy:

- **Organs:** heart two thirds to the body's left with the apex down and left, plus aorta, pulmonary trunk and vena cava; right lung with three lobes, left with two and the cardiac notch; windpipe dividing at the sternal angle; liver under the right dome of the diaphragm with the gallbladder; J-shaped stomach and spleen on the left; colon up the right, across and down the left, with the appendix; small intestine; bladder; lymph nodes and thymus. Back: cerebellum, spinal cord ending near L1 to L2, and kidneys from T12 to L3 with the left one higher.
- **Skeleton:** skull, jaw, 7 cervical, 12 thoracic and 5 lumbar vertebrae, sacrum, 12 pairs of ribs (7 true, 3 joined by cartilage to the costal margin, 2 floating), three-part sternum, clavicles, shoulder blades, pelvis with hip sockets, and humerus, radius (thumb side), ulna, hand, femur, kneecap, tibia, fibula (outer side) and foot.
- **Muscles:** named surface muscles, front and back, drawn as tapered bellies.
- **Levels:** organs and bones are placed against each other (for example the heart behind the sternum between ribs 2 and 6).
- **Limit:** these are hand-built schematic diagrams, checked against general anatomical knowledge, not traced from a medical atlas and not reviewed by a clinician. They show where things are. Nothing in the app computes a status or advice from the drawing.

## Right panel restructure, 14 Nov 2026

The right panel had three detail views (a reading, a body region, a body part) with different layouts, and the reading view was one and a half screens tall. Zac chose one shared layout (`panel/PanelShell.tsx`) for all of them:

- **Header, always in view:** a back link to where the item belongs (Heart rate shows "Heart and circulation"; Left knee shows "Bones and muscles"), the name, its status, one main action (Acknowledge for an unacknowledged alert, otherwise Measure or Log symptom) and a one-line summary.
- **Tabs:** Now (what to do, when to escalate, facts, and the other readings and symptoms in the same body system), Trend (the chart; History for a body part), About (why it changes in space, how to measure, keep healthy, sources). An item always opens on Now.
- **Footer, always in view:** Send report and Log action.
- **Report:** opens as a step inside the panel (or the tablet sheet, or the phone page), with a back link to what was open, instead of a sheet over the figure. Other pages still use the sheet.
- Scroll areas are `position: relative`, so screen-reader-only text cannot stretch the page.

## Part labels per view, 14 Nov 2026

The labels beside the figure now depend on the view. Organs keeps the nine body-system labels, which carry the readings. Muscles and Skeleton label every named part on the side shown (for example "Right forearm bones", "Left knee", "Lower back"). Labels sit next to their part: on the front view the body's right is on the viewer's left, on the back view it is on the viewer's right. A part with a symptom shows its status under the name. Tapping a label opens the part's page, where the symptom is logged. On narrow screens the list under the figure shows the same parts.
