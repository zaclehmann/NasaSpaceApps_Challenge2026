# MissionVitals UI spec

Version 3, 14 Nov 2026. Interface only: no backend, data model or API detail.
This file replaces `ui_plan.md`. Where they disagree, this file wins.

Built with the frontend-design and dataviz skills. Every status colour below was run through the dataviz colour-blind validator; results are in section 3.4.

---

## 0. Verdicts on your ideas

| Your idea | Verdict | Reason |
| --- | --- | --- |
| No login between astronauts | **Keep** | A crew tablet is a trusted device and passwords add friction with no demo value. You still need to know whose data is on screen: a one-tap crew picker on launch and the astronaut's name always in the header. |
| Main dashboard shows all 3 astronauts | **Drop as the main screen** | The challenge is self-assessment. Three people on one screen turns it into mission control and leaves no room for the body figure. Crew becomes its own screen for the commander and crew medical officer. |
| Current astronaut with connected devices | **Keep, devices demoted** | Device status matters because stale data must never look normal, but it's supporting detail. One status line under the figure. |
| 2D figure, arms and legs out | **Keep, as an A-pose** | NASA's brief suggests a clickable figure. Arms about 20° out, feet slightly apart. A full star pose wastes width and reads as a game sprite. |
| An indicator on each body section | **Change** | Numbers on the figure *and* in the list was the clutter in the last preview. The figure shows status per body system; numbers live in the list. Hover a list row to light its region; click a region to explain it. |
| Stats on the left | **Keep** | Left list, centre figure, right explanation panel. Reading order: my numbers, where in my body, what to do. |
| Vercel theme from 21st.dev | **Keep, exactly** | Your 12 tokens are copied verbatim into a paste-ready `globals.css` in section 3.1. It's the most common look on the web, so it can't be what makes us memorable. That job goes to the body figure. |
| Red, orange, yellow, green | **Change to red, amber, blue, green** | Measured, not guessed: the validator failed your four colours. Orange and green are nearly identical for people with red-weak vision (ΔE 4.8, pass is 8+), and yellow and orange sit below the normal-vision floor (ΔE 14.8, floor 15). Swapping yellow for **blue** passes every check. Blue for the lowest alert level is what the medical alarm standard IEC 60601-1-8 allows (cyan for low priority). Details in 3.4. |

### What your list was missing

1. **A routine.** The brief asks the tool to prompt measurements. It goes on the main screen.
2. **Guidance.** Every indicator and body system needs what it means, what to do and when to escalate. That's the "evaluate and act" half of the challenge.
3. **Escalation to Earth.** The brief asks when a result needs the crew or flight surgeons. Answer: three levels and a report sheet that works through the delayed link.
4. **Privacy inside the crew.** Mood answers show only to the astronaut and the crew medical officer.
5. **A five-second answer.** Before anything else, the screen must answer "Am I OK?" in one sentence (section 4.2).

---

## 1. Design direction

**Subject:** self-checks for astronauts on a long mission, used on a crew tablet between tasks, often tired, sometimes at the start of a sleep period, with Earth minutes away.

**Primary job:** in five seconds, tell the astronaut whether anything needs them, and in one more tap, what to do.

**The one bold thing:** the body systems figure. Everything around it stays quiet, monochrome and disciplined. If a new element competes with the figure for attention, cut it.

**Vernacular to borrow from the subject** (these are what make it look like a spaceflight tool, not a SaaS dashboard):
- NASA alert vocabulary: **Caution** and **Warning** (section 4.1).
- Mission elapsed time (MET) as the clock.
- Guided measurements written like flight procedures: numbered steps, one action per line, a procedure ID (`Procedure HM-3`). Numbering is justified here because the steps really are a sequence.
- The crew medical officer (CMO) and flight surgeon as named escalation roles.

**Principles**
1. Quiet until it matters: with everything in range the screen is black, white and grey with small green checks.
2. Explain, don't assume: every number has a plain meaning one tap away.
3. Works without Earth: nothing the astronaut needs waits for the link.
4. Honest data: simulated data, demo thresholds and missing readings are always labelled.

---

## 2. Banned list

Paste sections 2 and 3 into every AI coding prompt.

**Visual**
- No gradients of any kind.
- No glow, neon, glassmorphism, backdrop blur, noise or grain.
- No space decoration: stars, planets, orbits, nebulae, rockets, HUD frames, hexagons, scanlines.
- No terminal look, no green-on-black.
- No shadow except `--shadow-float` on menus, dialogs, sheets and toasts.
- No 3D, holographic or wireframe body, no realistic or textbook anatomy. The body figure may show schematic anatomy (section 6.1), drawn flat: no shading, gradients or lighting.

**Layout**
- No grid of identical rounded cards; no row of KPI tiles; no hero or welcome banner.
- No coloured left-border accent on boxes; no box inside a box.
- At most **three bordered surfaces** per screen. Everything else groups with spacing and hairline dividers.
- Not one radius on everything: radius follows the role (section 3.6).

**Template tells** (from the frontend-design skill; each one makes a page look generated)
- No uppercase or letter-spaced labels, and no eyebrow label above a heading.
- No meta strings joined with middle dots (`Day 142 · 14:33 · Hana`). Put facts in separate, labelled elements.
- No `→` or `›` appended to link or button text.
- No monospace for small labels or timestamps. Geist Mono appears only on the Methodology page for raw data.
- No single highlighted word inside a heading.
- No `Word — fragment` labels with a spaced em dash.

**Components**
- No emoji anywhere, including mood scales; no smiley icons.
- No sparkle "AI insight" icons; no avatar circles with initials.
- No donuts, gauges, dials or progress rings.
- No green fills or green row backgrounds; green is a small badge only.
- No points, XP, levels, trophies, confetti or reward sounds.

**Copy**
- No marketing words (seamless, powerful, intelligent, AI-powered); no exclamation marks.
- No diagnoses, drug names or doses. Guidance covers re-measuring, prevention, habits, mission procedure and escalation.
- No NASA logo, flag or mission insignia (submission rule).

---

## 3. Visual system

### 3.1 Theme tokens, verbatim from the 21st.dev Vercel theme

These are the exact values from the theme you linked. Use the `oklch()` values in CSS (Tailwind v4 accepts them); the hex column is a reference conversion only.

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | `oklch(0.99 0 0)` · `#FCFCFC` | `oklch(0 0 0)` · `#000000` |
| `--foreground` | `oklch(0 0 0)` · `#000000` | `oklch(1 0 0)` · `#FFFFFF` |
| `--card` | `oklch(1 0 0)` · `#FFFFFF` | `oklch(0.14 0 0)` · `#090909` |
| `--primary` | `oklch(0 0 0)` | `oklch(1 0 0)` |
| `--primary-foreground` | `oklch(1 0 0)` | `oklch(0 0 0)` |
| `--secondary` | `oklch(0.94 0 0)` · `#EBEBEB` | `oklch(0.25 0 0)` · `#222222` |
| `--accent` | `oklch(0.94 0 0)` · `#EBEBEB` | `oklch(0.32 0 0)` · `#333333` |
| `--muted` | `oklch(0.97 0 0)` · `#F5F5F5` | `oklch(0.23 0 0)` · `#1D1D1D` |
| `--muted-foreground` | `oklch(0.44 0 0)` · `#525252` | `oklch(0.72 0 0)` · `#A4A4A4` |
| `--border` | `oklch(0.92 0 0)` · `#E4E4E4` | `oklch(0.26 0 0)` · `#242424` |
| `--ring` | `oklch(0 0 0)` | `oklch(0.72 0 0)` |
| `--destructive` | `oklch(0.63 0.19 23.03)` | `oklch(0.69 0.20 23.91)` |
| `--radius` | `0.5rem` | `0.5rem` |

These 12 tokens are the complete set the theme page provides (confirmed by Zac, 14 Nov). Everything else is derived from them, never invented:

- `--card-foreground`, `--popover-foreground`, `--secondary-foreground`, `--accent-foreground` = `--foreground`.
- `--popover` = `--card`. `--input` = `--border`.
- `--chart-*` and sidebar tokens: not used. Charts follow section 7; the app has no sidebar.
- Fonts: **Geist** (UI) and **Geist Mono** (Methodology data only), Vercel's own typefaces, both on Google Fonts.
- `--destructive` is not used for health status (it's too close to Warning red to mean anything different). It stays in the file for completeness; this app has no destructive buttons.

#### Paste-ready `globals.css` (Tailwind v4)

```css
@import "tailwindcss";

:root {
  /* Vercel theme, verbatim */
  --background: oklch(0.99 0 0);
  --foreground: oklch(0 0 0);
  --primary: oklch(0 0 0);
  --primary-foreground: oklch(1.00 0 0);
  --secondary: oklch(0.94 0 0);
  --accent: oklch(0.94 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.44 0 0);
  --card: oklch(1.00 0 0);
  --border: oklch(0.92 0 0);
  --ring: oklch(0 0 0);
  --destructive: oklch(0.63 0.19 23.03);
  --radius: 0.5rem;

  /* Derived from the theme */
  --card-foreground: var(--foreground);
  --popover: var(--card);
  --popover-foreground: var(--foreground);
  --secondary-foreground: var(--foreground);
  --accent-foreground: var(--foreground);
  --input: var(--border);

  /* Added for MissionVitals */
  --subtle-foreground: #6B6B6B;
  --border-strong: #C9C9C9;
  --figure: #E9E9E9;
  --link: #0068D6;
  --shadow-float: 0 8px 24px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);

  /* Status: badge, text, tint */
  --ok: #15803D;       --ok-text: #15803D;
  --watch: #0EA5E9;    --watch-text: #0369A1;    --watch-tint: #F0F9FF;
  --caution: #F59E0B;  --caution-text: #B45309;  --caution-tint: #FFFBEB;
  --warning: #DC2626;  --warning-text: #B91C1C;  --warning-tint: #FEF2F2;
  --nodata: #8F8F8F;   --nodata-text: #525252;
}

.dark {
  /* Vercel theme, verbatim */
  --background: oklch(0 0 0);
  --foreground: oklch(1.00 0 0);
  --primary: oklch(1.00 0 0);
  --primary-foreground: oklch(0 0 0);
  --secondary: oklch(0.25 0 0);
  --accent: oklch(0.32 0 0);
  --muted: oklch(0.23 0 0);
  --muted-foreground: oklch(0.72 0 0);
  --card: oklch(0.14 0 0);
  --border: oklch(0.26 0 0);
  --ring: oklch(0.72 0 0);
  --destructive: oklch(0.69 0.20 23.91);

  /* Added for MissionVitals */
  --subtle-foreground: #8C8C8C;
  --border-strong: #3A3A3A;
  --figure: #1A1A1A;
  --link: #52A8FF;
  --shadow-float: 0 8px 24px rgba(0,0,0,.6);

  --ok: #16A34A;       --ok-text: #4ADE80;
  --watch: #38BDF8;    --watch-text: #7DD3FC;    --watch-tint: #0A1822;
  --caution: #FBBF24;  --caution-text: #FCD34D;  --caution-tint: #211905;
  --warning: #F87171;  --warning-text: #FCA5A5;  --warning-tint: #2A1010;
  --nodata: #6B6B6B;   --nodata-text: #A4A4A4;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-accent: var(--accent);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-subtle-foreground: var(--subtle-foreground);
  --color-card: var(--card);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-figure: var(--figure);
  --color-link: var(--link);
  --color-ok: var(--ok);           --color-ok-text: var(--ok-text);
  --color-watch: var(--watch);     --color-watch-text: var(--watch-text);     --color-watch-tint: var(--watch-tint);
  --color-caution: var(--caution); --color-caution-text: var(--caution-text); --color-caution-tint: var(--caution-tint);
  --color-warning: var(--warning); --color-warning-text: var(--warning-text); --color-warning-tint: var(--warning-tint);
  --color-nodata: var(--nodata);   --color-nodata-text: var(--nodata-text);
  --font-sans: "Geist", system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: var(--radius);
  --radius-xl: 12px;
  --shadow-float: var(--shadow-float);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  font-variant-numeric: tabular-nums;
}
```

Use only these names in components (`bg-card`, `text-caution-text`, `bg-warning-tint`). Raw Tailwind colours such as `bg-blue-500` are not allowed anywhere.

**Tokens we add** (the theme has no status or link colours):

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--subtle-foreground` | `#6B6B6B` | `#8C8C8C` | Timestamps, sources (≥ 4.5:1) |
| `--border-strong` | `#C9C9C9` | `#3A3A3A` | Chart axis, figure outline on hover |
| `--figure` | `#E9E9E9` | `#1A1A1A` | Body silhouette fill |
| `--link` | `#0068D6` | `#52A8FF` | Inline text links only |
| `--shadow-float` | `0 8px 24px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)` | `0 8px 24px rgba(0,0,0,.6)` | Floating layers only |

### 3.2 Status system

Five states. Each has one meaning, one shape, one word and one colour. The words for the top two levels are NASA's own spacecraft alert classes.

| State | Word | Means | Badge | Light badge | Light text | Dark badge | Dark text |
| --- | --- | --- | --- | --- | --- | --- | --- |
| In range | "In range" | Inside the astronaut's demo range | Circle with check | `#15803D` | `#15803D` | `#16A34A` | `#4ADE80` |
| Watch | "Watch" | In range but trending toward a limit, or a routine check is overdue | Circle with i | `#0EA5E9` | `#0369A1` | `#38BDF8` | `#7DD3FC` |
| Caution | "Caution" | Outside the demo range: needs attention, not immediate action | Triangle with ! | `#F59E0B` | `#B45309` | `#FBBF24` | `#FCD34D` |
| Warning | "Warning" | Outside the critical demo range: act now | Octagon with ! | `#DC2626` | `#B91C1C` | `#F87171` | `#FCA5A5` |
| No data | "No data" | Sensor silent, or measurement never taken | Dashed circle with – | `#8F8F8F` outline | `#525252` | `#6B6B6B` outline | `#A4A4A4` |

Glyph inside the badge: white on In range, Watch (light) and Warning; `#000` on Caution (both modes) and on Watch, In range and Warning in dark mode.

Background tints (rows and body regions, Watch and above only):

| State | Light | Dark |
| --- | --- | --- |
| Watch | `#F0F9FF` | `#0A1822` |
| Caution | `#FFFBEB` | `#211905` |
| Warning | `#FEF2F2` | `#2A1010` |

### 3.3 Status rules

1. Colour goes on four things only: the badge, the status word, the value text, and the tint behind a row or region (Watch and above).
2. Green stays small: a badge, never a fill, row or region. A screen that's all green hides the one problem.
3. Status colour never marks selection, focus or links. Those are black/white (`--foreground`) and `--link`.
4. Worst state wins for a body region and for the overall summary.
5. The status key (all five badges, words and meanings) is always one click away: the **Status key** item in the bottom status bar on tablet and desktop, and printed under the body figure on phone.
6. The status word is always printed next to the badge. Never the badge alone.

### 3.4 Validator results (dataviz skill, `validate_palette.js`, all-pairs)

| Palette | Mode | Colour-blind separation | Normal-vision floor | Result |
| --- | --- | --- | --- | --- |
| Your proposal `#16A34A #EAB308 #F97316 #DC2626` | Light | **Fail**: orange vs green ΔE 4.8 (protan) | **Fail**: yellow vs orange ΔE 14.8 | Fail |
| Your proposal, dark variant | Dark | Warn: ΔE 7.0 | **Fail**: ΔE 14.6 | Fail |
| Chosen `#15803D #0EA5E9 #F59E0B #DC2626` | Light | Pass: worst ΔE 8.6 | Pass: worst ΔE 24.1 | **All checks pass** |
| Chosen `#16A34A #38BDF8 #FBBF24 #F87171` | Dark | Warn: ΔE 7.4 (legal with shape + word, which every badge has) | Pass: ΔE 21.2 | Pass with secondary encoding |

Caution amber and Watch blue are below 3:1 against the light background, so they never carry text; their words use the darker text colours in 3.2.

### 3.5 Type

One family, Geist. Hierarchy from size and weight only. Scale follows a 1.2 ratio from 15 px.

| Style | Size / line | Weight | Use |
| --- | --- | --- | --- |
| Page title | 26 / 32 | 600, tracking −0.02em | One per screen |
| Summary sentence | 20 / 28 | 500 | The "Am I OK?" line |
| Section | 17 / 24 | 600 | Section headings |
| Body | 15 / 22 | 400 | Default |
| Small | 14 / 20 | 400 | Lists, tables, panels |
| Label | 13 / 18 | 500, `--muted-foreground` | Field labels, units, column headers |
| Caption | 12 / 16 | 400, `--subtle-foreground` | Timestamps, sources |
| Value XL | 44 / 48 | 600, tracking −0.03em | Selected indicator in the panel |
| Value | 22 / 28 | 600 | Values in the indicator list |

- All numbers: `font-variant-numeric: tabular-nums`.
- Sentence case everywhere. Lines of text ≤ 70 characters.
- Units in Label style after the value: `119` `bpm`.

### 3.6 Space, radius, borders

- Spacing: 4, 8, 12, 16, 24, 32, 48.
- Radius follows role, so hierarchy shows: sheets and dialogs 12 px; the detail panel 8 px (theme `--radius`); buttons and inputs 6 px; badges' tint chips 4 px; tables, list rows and the routine bar 0.
- Borders: 1 px `--border`. Selection: 2 px `--foreground` outline.

### 3.7 Icons

- Lucide (`lucide-react`), 1.5 px stroke, 16 px in rows and buttons, 20 px in the header. One library only.
- Status badges are custom 16 px SVGs, not Lucide.
- One icon per indicator in `--muted-foreground`: `HeartPulse` heart rate, `Activity` blood pressure, `Wind` SpO₂, `Thermometer` temperature, `Droplet` blood glucose, `Moon` sleep, `Brain` mood, `Radiation` habitat radiation, `Dumbbell` exercise.
- Devices: `Shirt` wearable, `Activity` BP cuff, `Droplet` glucometer, `Radiation` dosimeter.
- No icons in front of headings; nothing decorative.

---

## 4. Research behind the choices

Each rule here comes from a source a judge could check.

### 4.1 Use NASA's alert vocabulary
NASA's alert guidance for crewed vehicles defines four classes: **Emergency** (immediate action to prevent loss of crew or mission), **Warning** (requires immediate action), **Caution** (needs attention but not immediate action) and **Advisory** (normal-state information). Our Warning and Caution map directly. Emergency is reserved for vehicle events (fire, depressurisation), so this app never uses it. Watch is our own word for the low "keep an eye on it" level.

### 4.2 Make alerts distinguishable fast
The same NASA source reports ISS crew find alerts "hard to distinguish in the first seconds, especially when waking up", and warns that too many alerts "become a nuisance, leading to failure to respond". So:
- Every alert level differs in **shape, word, colour and position** (Warning gets a full-width bar; Caution doesn't).
- The alert rules use sustain windows and hysteresis so noise doesn't fire alerts.
- Acknowledge silences an alert's prominence without hiding it.
- The **summary sentence** sits at the top of the right panel: "1 caution needs you: heart rate." or "You're in range. Next check: mood, due now."

### 4.3 Borrow from medical alarm standards
IEC 60601-1-8 (medical device alarms) uses red for high-priority alarms and allows cyan for low priority. That's the basis for using blue for Watch rather than yellow, which also fixed the colour-blind failure in 3.4.

### 4.4 Overview, then detail on demand
The three columns follow the classic "overview first, zoom and filter, then details on demand" pattern: the list is the overview, the figure filters by body system, the panel is the detail.

### 4.5 Design for the crew's day
- **Sleep period:** when the mission schedule is in the crew sleep period, the app switches to dark mode automatically (the user can override). The tablet may be checked just after waking, so dark mode is a primary design, not an afterthought.
- **Moving bodies, floating tablets:** touch targets are 48 px minimum on tablet (above the usual 44 px).
- **Tired users:** one primary action per region; no screen asks two questions at once.

### 4.6 Link body regions to NASA's own risks
Each region of the figure carries the name of the matching risk from NASA's Human Research Program "Risks of Human Spaceflight" list (table in 5.2). That answers the brief's question "how do spaceflight hazards affect these indicators?" in NASA's words.

### 4.7 Use the CSA Bio-Monitor as the device model
The device line names a wearable shirt, a BP cuff and a glucometer. The CSA Bio-Monitor (a smart shirt and headband) measures heart activity, blood pressure, breathing, skin temperature, blood oxygen and activity, so a shirt that reports heart rate, SpO₂ and temperature is realistic. Glucose and mood are entered by hand.

---

## 5. Screens

### 5.1 Crew picker (launch)

Shown on first open, and from **Switch** in the header. No password.

```
MissionVitals                                     Ares Transit 1     Mission day 142

Who's checking in?

  Hana Park           Flight engineer          ▲ Caution     Last check-in 07:12
  ──────────────────────────────────────────────────────────────────────────────
  Mira Okafor         Commander                ✓ In range    Last check-in 06:55
  ──────────────────────────────────────────────────────────────────────────────
  Tomas Lindqvist     Crew medical officer     i Watch       Last check-in 07:30

  Open crew overview                           Simulated data for this demo
```

- A divided list. Each whole row is one button, 64 px tall.
- Badge and word only; no numbers here (privacy).
- Remembers the last choice on this device and opens straight to My Health next time.

### 5.2 My Health (main screen)

#### Desktop and tablet landscape, 1280 px and up

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ MissionVitals │ Ares Transit 1   Mission day 142   MET 141d 14:33 │ Earth link up, 6 min 48 s │ Hana Park  Switch │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Today's routine   ▮▮▮▮▯▯  4 of 6 done   Streak 12 days   Next: mood check-in, due now [Start] │
├──────────────────────────────┬────────────────────────────────────┬──────────────────────────┤
│ Indicators                   │                                    │ 1 caution needs you:     │
│                              │                 ○                  │ heart rate.              │
│ Live from your shirt         │               ┌───┐                │                          │
│ ▲ Heart rate   119 bpm   ↑   │          ╲    │ ▲ │    ╱           │ ▲ Caution  Heart rate    │
│ ✓ SpO₂          98 %     →   │           ╲   │   │   ╱            │ 119 bpm                  │
│ ✓ Temperature  36.7 °C   →   │               │   │                │ Above 110 for 9 min      │
│                              │               ├───┤                │ What to do now           │
│ Entered by you today         │               │   │                │ 1 Rest 5 minutes         │
│ i Blood pressure 128/84 mmHg │               /   \                │ 2 Check shirt fit        │
│ ✓ Blood glucose   96 mg/dL   │              /     \               │ 3 Re-measure             │
│ ✓ Sleep          6.2 h       │                                    │ When to escalate         │
│ ◌ Mood           Due now     │   ✓ In range  i Watch  ▲ Caution   │ [chart]                  │
│                              │   ⯃ Warning  ◌ No data             │ Why it changes in space  │
│ Habitat                      │   Shirt connected  BP cuff 07:02   │ Sources                  │
│ ✓ Radiation   9.1 µGy/h      │   Glucometer 07:10  Dosimeter      │                          │
└──────────────────────────────┴────────────────────────────────────┴──────────────────────────┘
      340 px, hairline right        flexible, figure max 440 px          400 px panel (radius 8)
```

**Header, 56 px.** Separate items, divided by spacing and vertical hairlines, never joined with dots:
- Product name.
- Mission block: mission name, "Mission day 142", "MET 141d 14:33".
- Earth link: "Earth link up, 6 min 48 s" in `--muted-foreground`; when down, Caution badge + "Earth link down, 3 reports queued".
- Astronaut name and a **Switch** text button.
- A small **Demo** button.

**Routine bar, 56 px.** Segmented progress (black filled = done, outlined = not yet, Watch badge = overdue), "4 of 6 done", "Streak 12 days", next task and a **Start** button. See 5.7.

**Left column: Indicators.**
- Three groups with plain headings: **Live from your shirt**, **Entered by you today**, **Habitat**. Grouping by source tells the astronaut what updates itself and what they must measure.
- Row: badge, indicator icon, name, value + unit, trend arrow (↑ ↓ → in `--muted-foreground`), reading time on a second line in Caption.
- Hover: `--muted` background, and the matching body region gets a 2 px `--foreground` outline. Selected: `--muted` background + 600-weight name. Watch and above: status tint.
- A due manual measurement shows "Due now" and a **Measure** button in place of the value.

**Centre: Body systems figure** (full spec in section 6). The legend and device line sit under it.

**Right column: Panel.**
1. **Summary sentence** (Summary style), the five-second answer. Examples: "You're in range. Next check: mood, due now." / "1 caution needs you: heart rate." / "Warning: SpO₂ is low. Act now."
2. If more than one item is Caution or Warning, a short list of them, each opening its detail. Watch items collapse under "Also watching (2)".
3. The detail view for the selected item: an indicator (5.3) or a body region (5.4). Default selection is the worst item.

#### Tablet 768 to 1279 px
- Two columns: Indicators (320 px) and the figure.
- The summary sentence moves into a strip under the routine bar, with an **Open** button.
- Details open in a right **sheet** (440 px, radius 12, `--shadow-float`). Close with the close button, Escape, or tapping outside.

#### Phone, under 768 px
- Bottom tabs: **Today**, **Body**, **Trends**, **More**.
  - Today: summary sentence, routine, indicator list.
  - Body: figure, legend, devices.
  - Trends: indicator picker and chart.
  - More: Crew, Learn, Methodology, Demo controls, Switch astronaut.
- Details open as full pages with a back button.
- Header shrinks to the astronaut name and Earth link state.

### 5.3 Indicator detail

Order: status, number, action, trend, explanation.

1. Icon, name, badge and word. **Measure** or **Re-measure** for manual indicators.
2. Value XL with unit. Under it in Caption: "From your shirt at 14:32 MET" or "Entered by you at 07:02 MET".
3. One plain status line: "Above your demo range of 50 to 110 bpm for 9 minutes."
4. **What to do now**: numbered steps for the current state, written like a procedure. Example for heart rate, Caution:
   1. Stop and rest for 5 minutes.
   2. Check the shirt sits snug across your chest.
   3. Re-measure. If it's still above 110 bpm, contact the crew medical officer.
5. **When to escalate**: three levels, the current one marked with a filled dot and 600 weight.
   - Yourself: rest, hydrate, re-measure.
   - Crew medical officer: still out of range after re-measuring, or you feel unwell.
   - Flight surgeon on Earth: any Warning, or a Caution that repeats over days. **Send report** button (5.8).
6. **Chart** (section 7), with tabs `1 h` (live only), `24 h`, `7 d`, `30 d`.
7. **Why it changes in space** (collapsed): two or three sentences, hazard tags (for example Gravity fields, Isolation and confinement) and the NASA risk name as a link.
8. **How to measure** (collapsed): the same steps as the guided dialog.
9. Sources in Caption.

### 5.4 Body region detail

1. Region name, badge and word.
2. **What it does**: one sentence.
3. **Your readings**: mini rows (badge, name, value), each opening 5.3.
4. **Spaceflight risk**: the NASA risk name, one sentence, hazard tags.
5. **Keep it healthy**: two or three habits, for example "Complete today's resistance exercise session".
6. Regions with no direct measurement (Bones and muscles, Eyes, Inner ear, Immune system) still open. They show the risk, prevention, a related log or quick check, and "This prototype doesn't measure this directly."

### 5.5 Guided measurement (procedure dialog)

Opened from the routine bar, a **Measure** button or a body region. Dialog 560 px wide, radius 12; full screen on phone. Title shows the procedure, for example "Blood pressure, Procedure HM-3", with "Step 1 of 3".

| Step | Content |
| --- | --- |
| 1. Prepare | Numbered instructions, one action per line. Blood pressure: "Sit with your back supported and feet restrained for 5 minutes", "Fit the cuff on your upper arm at heart level", "Stay still and quiet during the reading". Equipment line with its icon. Button **I'm ready** |
| 2. Enter | Large numeric fields with fixed units. Blood pressure: systolic and diastolic (mmHg), pulse (bpm). Glucose: value (mg/dL) and timing (Fasting, Before a meal, After a meal). Inline errors like "Systolic must be between 60 and 250 mmHg". Button **Save reading** |
| 3. Result | Badge, word, the value, the "What to do now" steps, and the escalation levels opened if Caution or Warning. Button **Done** updates the routine |

**Mood check-in** uses the same dialog with a different step 2:
- "How is your mood today?" Five joined buttons with words: Very low, Low, Okay, Good, Very good. No faces.
- "How stressed do you feel?" Same pattern.
- Optional toggle tags: Tired, Lonely, Irritable, Unfocused, Motivated, Connected.
- Optional note.
- A line with a lock icon: "Private. Only you and the crew medical officer see this."

### 5.6 Alerts

- **Warning**: full-width bar under the header, Warning tint, 1 px Warning bottom border, octagon badge, one sentence, **View** button. Stays until acknowledged. One short two-tone sound when the Warning first appears, rung once and never repeated (not rung late if audio was still locked). It is never muted: the header **Sound on / Sound off** toggle covers click feedback only. No flashing, no blocking pop-up.
- **Caution**: in the summary sentence, the indicator row and the body region. No bar.
- **Watch**: under "Also watching". Never interrupts.
- Every alert's detail shows why it fired (rule and numbers), what to do, the escalation level, and an action log with **I re-measured**, **Checked the sensor**, **Contacted the CMO** and **Add note**. **Acknowledge** is the primary button.

### 5.7 Routine and light gamification

- **Due now**: the actions are a solid red **Postpone** (no pulse) and a solid green **Start** that pulses slowly (stopped by reduced motion), the same in the status strip and the routine table. On phone the strip keeps only **Start**; Routine and Symptoms move to the More tab. **Postpone** opens a dialog with a dropdown (5, 10, 15 or 30 minutes, 1 or 2 hours, default 30) and shows the new due time. A short two-tone alarm rings on every page while the task stays due: every 30 s for the first 2 min, every 15 s to 5 min, every 10 s to 10 min, then every 2.5 s, counted from the due time. It stops when the task is done, postponed or turns overdue, pauses while a measurement or the Postpone dialog is open, and waits for the first click or key press if the browser has not unlocked audio. On the crew picker, a row whose check is due now blinks with a red left bar and tint (reduced motion keeps the tint). The alarm is never muted. The header **Sound on / Sound off** toggle is for click feedback only (the click sound and vibration). The full routine opens as a page from **Routine** in the strip, as a table with Status and Actions columns.

This is a duty roster, not a game.

- Routine bar as in 5.2. Clicking it opens a popover listing today's tasks: time, task, status (Done 07:02, Due now, Due 16:00, Overdue 40 min) and **Start**.
- Demo routine: 07:00 blood pressure, 07:10 blood glucose (fasting), 07:15 sleep review, mood check-in (due now), 16:00 exercise log, 21:00 evening blood pressure.
- Allowed: day streak, weekly completion ("This week: 38 of 42 tasks"), and a crew-wide routine completion line on the Crew screen. Team effort, no leaderboard.
- Not allowed: points, XP, levels, badges, trophies, confetti, reward sounds.

### 5.8 Send report to the flight surgeon

A sheet, 440 px, opened from any escalation section.

- Read-only summary: who, when, out-of-range indicators with values, actions already taken, 24-hour trend thumbnails.
- **Your note** (optional) and **Urgency**: Routine, Within 24 hours, Urgent.
- Delivery line from the Earth link:
  - Link up: "Arrives on Earth in about 6 min 48 s. A reply takes at least 13 minutes."
  - Link down: Caution badge, "Earth link down. Your report will send automatically when the link returns."
- **Queue report**. Then a toast, "Report queued", and a row in the downlink list.

### 5.9 Crew overview (commander and CMO)

- One table: name, role, overall status, heart rate, blood pressure, SpO₂, temperature, sleep, mood ("Private" unless the viewer is the CMO), routine today, last check-in.
- Below it: habitat radiation (current dose rate, mission total, 14-day chart) and the Earth downlink queue as a divided list.
- On tablet and phone, rows become divided list blocks.

### 5.10 Learn, Methodology, Demo controls

- **Learn**: one section per hazard. Each names the NASA risks it drives and the indicators MissionVitals uses for them, linking to body regions. Reading layout, max 680 px.
- **Methodology**: data sources, simulation, alert rules, demo thresholds table, status colour validation (3.4), limitations, AI-use statement, references. Geist Mono allowed here for raw values.
- **Demo controls**: right sheet titled "Demo controls" with "Simulated data" under it. Scenario list (radio rows with one-line descriptions), Earth link switch, sleep-period switch (shows the automatic dark mode), theme override, astronaut switch.

---

## 6. Body systems figure

### 6.1 Drawing
- Front view, A-pose: arms about 20° out from the body, hands clear of the hips, feet about shoulder width apart.
- Flat `--figure` fill and a 1 px `--border-strong` contour. No shading, face or gender cues.
- Three anatomy views, switched with a segmented control above the figure and remembered on the device:
  - **Organs**: brain, eyes, inner ear, windpipe and bronchi, a three-lobed right lung and two-lobed left lung, heart with its great vessels, liver, gallbladder, stomach, spleen, large and small intestine, bladder, lymph nodes and thymus. The back shows the cerebellum, spinal cord and kidneys.
  - **Muscles**: the main surface muscles by name, front (pectorals, deltoids, biceps, abdominals, obliques, quadriceps and so on) and back (trapezius, latissimus, triceps, glutes, hamstrings, calves).
  - **Skeleton**: skull and jaw, 24 vertebrae and sacrum, 12 pairs of ribs with their cartilage, sternum, clavicles, shoulder blades, pelvis and every long bone, with the organs visible behind the ribs.
- Each view has a front and a back, and organs sit at their true levels against the ribs and spine (heart behind the sternum between ribs 2 and 6, liver under the right dome of the diaphragm, kidneys from T12 to L3).
- The drawings are schematic teaching diagrams. No status, alert or advice is computed from them.
- Anatomy uses neutral tone tokens (`--organ`, `--bone`, `--muscle` and their `-line` pairs). Status colour appears only on a region that is Watch, Caution, Warning or No data. A line under the view switch gives the readings that matter for the view (exercise for Muscles, exercise and dose for Skeleton).
- SVG, viewBox `0 0 320 600`. Scales with its column: max 440 px wide, min 240 px.

### 6.2 Regions

Nine regions, each its own focusable SVG group.

| Region | Area on the figure | Indicators | NASA HRP risk |
| --- | --- | --- | --- |
| Brain and mood | Upper head | Mood, sleep | Behavioral Changes and Psychiatric Disorders; Inadequate Sleep and Irregular Schedules |
| Eyes | Band across the face | Vision check (stretch) | Spaceflight Associated Neuro-ocular Syndrome |
| Inner ear and balance | Two marks at the sides of the head | Dizziness check (stretch) | Altered Sensorimotor and Vestibular Function |
| Heart and circulation | Figure's left chest | Heart rate, blood pressure | Cardiovascular Adaptations |
| Lungs and oxygen | Upper chest | SpO₂ | Hypoxia |
| Immune system | Neck and underarm marks | Temperature (fever check) | Altered Immune System Responses |
| Gut and metabolism | Abdomen | Blood glucose | Inadequate Food and Nutrition |
| Bones and muscles | Arms and legs | Exercise (shirt, confirmed daily) | Spaceflight-Induced Bone Changes; Reduced Cardiorespiratory and Musculoskeletal Fitness |
| Whole body | Thin ring around the whole figure, crew-wide | Habitat radiation | Radiation-Induced Cancers |

### 6.3 States

| State | Fill | Edge | Badge at the region's anchor |
| --- | --- | --- | --- |
| In range | `--figure` | none | none (the legend explains the calm figure) |
| Watch, Caution, Warning | status tint | 1.5 px status badge colour | status badge |
| No data | `--figure` | 1.5 px dashed `--muted-foreground` | dashed-circle badge |
| Hover or linked hover | unchanged | 2 px `--foreground` | tooltip: region name and status word |
| Selected | unchanged | 2 px `--foreground` | unchanged |

### 6.4 Interaction
- Click, Enter or Space on a region opens 5.4 in the panel.
- Hovering a list row highlights its region, and hovering a region highlights its rows.
- Each region has an `aria-label`, for example "Heart and circulation, caution, 2 readings". Tab order runs top to bottom.

---

## 7. Charts

From the dataviz skill. Each chart shows one indicator.

| Element | Rule |
| --- | --- |
| Form | Live indicators: line. Manual readings: dots, 8 px. Blood pressure: one vertical bar per reading from diastolic to systolic (same unit, one axis). Sleep: bars per night. |
| Line | 2 px `--foreground`, linear, no smoothing. Only the latest point has a dot. |
| Out of range | The same segment redrawn in the status badge colour. |
| Demo range | Band in `--muted` between the limits, labelled "Demo range" at the right end in Caption. |
| Limits | 1 px dashed `--border-strong` (dashing is right here because it marks a threshold), value and "demo" at the right end. |
| Grid and axis | Solid hairlines only: grid `--border`, axis `--border-strong`. Horizontal grid lines only. Never dashed grid lines. |
| Missing data | Gap in the line plus a hatched band labelled "No data". Never interpolate across a gap. |
| Alert marker | 1 px vertical line in the status colour, labelled "Caution 14:21" at the top. |
| Axes | One y-axis, 4 or 5 ticks, unit above it. X-axis in mission time. Never two y-axes. |
| Labels | Text uses text tokens, never the status colour. Label only the latest value and the extreme. No number on every point. |
| Legend | None for a single series; the chart title names it. |
| Hover | Crosshair and tooltip on lines; per-point tooltip on dots and bars. Tooltip: time, value and unit, status word, source. Hit area wider than the mark. |
| Accessibility | `aria-label` summary and a **View as table** text button. |
| Library | Recharts, with these rules overriding its defaults. Animation off on updates. |

---

## 8. Components

| Component | Spec |
| --- | --- |
| Primary button | `--primary` fill, `--primary-foreground` text, radius 6, 40 px tall (48 px on tablet and phone). One per region. |
| Secondary button | `--card` fill, 1 px `--border`, `--foreground` text; hover `--muted`. |
| Text button | `--foreground`, underline on hover. Inline links in prose use `--link`. |
| Tabs, segmented control | Text items. Selected: 600 weight and 2 px `--foreground` underline. |
| Input | 1 px `--border`, radius 6, `--card` fill, label above; focus 2 px `--ring`. |
| Numeric input | 28 px value text, unit fixed inside on the right, `inputmode="decimal"`. |
| 1 to 5 scale | Five joined buttons with word labels. Selected: `--foreground` fill, `--background` text. |
| Toggle tag | 32 px tall, radius 16, 1 px `--border`. On: `--foreground` fill. |
| Status badge | 16 px custom shape, always with its word. |
| Divided list | 1 px `--border` between rows, 12 px vertical padding, no outer box. |
| Table | Header row `--muted` in Label style, row dividers, no zebra stripes or vertical lines, 48 px rows. |
| Sheet | 440 px, `--card`, radius 12 on the inner corners, `--shadow-float`. |
| Dialog | Up to 560 px, centred, radius 12, `--shadow-float`, scrim `rgba(0,0,0,.4)`. |
| Toast | Bottom right, one line, 4 seconds, confirmations only. |
| Empty state | One sentence telling the user what to do. No illustration. |
| Loading | Skeleton rows in `--muted` in the final layout. No spinner longer than 1 second. |

---

## 9. Copy

- Voice: a calm crewmate. Not a doctor, not a robot.
- Fact first, then action: "Heart rate above 110 bpm for 9 minutes. Rest and re-measure."
- Every number has a unit. Thresholds are demo values, stated once as the source of truth (the status bar notice and the Methodology page), not repeated on every line (decided by Zac, 14 Nov).
- Time in MET ("MET 141d 14:33"); relative time only for freshness ("Updated 12 seconds ago").
- Missing data: "No reading for 6 minutes", never a stale number.
- Buttons say exactly what happens, and the confirmation repeats the verb: **Save reading** → "Reading saved". **Queue report** → "Report queued".
- Errors say what's wrong and how to fix it, without apology.

---

## 10. Motion

Motion answers an action or marks a change. One orchestrated moment, nothing decorative.

**The one orchestrated moment: the body scan.** After choosing an astronaut, the figure's regions take on their status from head to feet over 600 ms, then stop. It plays once per session and is skipped with reduced motion. It's subject-grounded (a scan) and it teaches the figure's colour code in the first second.

**Allowed responses to change**
- Row and region highlight: 120 ms colour fade.
- Sheet and dialog: 200 ms slide and fade.
- New reading: the value cross-fades in 150 ms. No counting up, no flash.
- Status change on a region: tint fades in over 300 ms, once.
- Routine segment fills over 200 ms when a task completes.
- Data-driven exception: the heart-rate icon may pulse once per measured beat (scale 1 to 1.1). It shows the real rate, so it's information. It stops when data is missing.

**Banned:** fade-and-slide-up on every section, hover lifts on panels, breathing or glowing elements, parallax, bounce, confetti, pulsing alerts.

Everything above turns off under `prefers-reduced-motion: reduce`.

---

## 11. Accessibility

- Text ≥ 4.5:1; badges and icons ≥ 3:1 (or, for Caution and Watch in light mode, always paired with their word, per 3.4).
- Status is never colour alone: shape and word on every badge.
- Everything reachable by keyboard; visible 2 px focus ring; Escape closes sheets and dialogs; focus returns to what opened them.
- Real elements: `<button>`, `<a>`, `<table>` with `<th scope>`, `<label for>`. Body regions are focusable with roles and labels.
- New Caution announced politely; Warning assertively.
- Touch targets 48 px on tablet and phone.
- Charts have a table view.

---

## 12. Responsive summary

| Width | Layout |
| --- | --- |
| 1280 px and up | Header, routine bar, three columns (list 340, figure, panel 400) |
| 1024 to 1279 px | Two columns (list 320, figure); summary strip; details in a right sheet |
| 768 to 1023 px | As above; header drops the MET clock |
| Under 768 px | Bottom tabs (Today, Body, Trends, More); details as full pages; tables become lists |

No sideways page scroll at any width. Only charts and tables may scroll inside their own box.

---

## 13. UI build order

1. Paste the `globals.css` block from 3.1. Status badge component. Geist fonts.
2. App shell: header, routine bar, three-column grid and its breakpoints.
3. Indicator list with groups and states.
4. Body figure: regions, states, linked hover, body scan.
5. Right panel: summary sentence, indicator detail, region detail.
6. Procedure dialog: blood pressure, glucose, mood.
7. Charts.
8. Alerts, report sheet, Earth link states.
9. Crew picker, crew overview, Learn, Methodology, demo controls.
10. Phone pass, keyboard pass, reduced-motion pass, dark-mode pass.

---

## 14. Prompt block for the AI coding tool

> Build to ui.md exactly. Professional medical tool on the Vercel monochrome theme (Geist; tokens in section 3.1, copied verbatim). Colour is only for status: green check circle (In range), blue info circle (Watch), amber triangle (Caution), red octagon (Warning), dashed grey circle (No data), always with the word. The body systems figure is the one bold element; everything else is quiet. No gradients, glows, blur, space decoration, emoji, card grids, KPI tiles, avatars, uppercase or eyebrow labels, middle-dot meta strings, arrows appended to links, monospace labels, donuts or decorative animation. Group with spacing and hairlines; at most three bordered surfaces per screen. Tabular numerals. When unsure, choose the plainer option.

---

## 15. Review checklist (every screen)

- [ ] Does the summary sentence answer "Am I OK?" in five seconds?
- [ ] Greyscale screenshot: can you still tell what's wrong?
- [ ] With everything in range: only small green checks, no tinted rows or regions?
- [ ] Three or fewer bordered surfaces?
- [ ] Any gradient, glow, blur, emoji, avatar, uppercase label, middle-dot string, appended arrow or monospace label?
- [ ] Every number has a unit, a time and a status?
- [ ] Missing data clearly different from in-range data?
- [ ] From any Caution or Warning to "what do I do" in one tap?
- [ ] Mood hidden from crewmates?
- [ ] 390 px wide: no sideways scroll, targets 48 px, details as pages?
- [ ] Keyboard only: open a region, take a reading, acknowledge an alert, queue a report?
- [ ] Dark mode checked as carefully as light?
- [ ] Next to a hospital monitor, would it look at home? If it looks like a game or a landing page, it fails.

---

## Sources

- [21st.dev Vercel theme](https://21st.dev/@serafimcloud/themes/vercel) (theme tokens)
- [NASA HRP: Five Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/)
- [NASA HRP: Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/)
- [NASA: Commercial LEO Destinations HSI workshop, Alerts](https://ntrs.nasa.gov/api/citations/20240003565/downloads/CLD%20HSI%20Workshop%20Alerts.pdf) (alert classes, crew feedback, nuisance alerts)
- [IEC 60601-1-8, visual alarm signal characteristics](https://standards.har-el.com/Projects/181701/60601-1-8/html/A2SubCl-6-3-2-2-Visual-Characteristics.htm) (red for high priority, cyan allowed for low)
- [CSA: Bio-Monitor](https://www.asc-csa.gc.ca/eng/sciences/astroskin.asp) (wearable device model)
- [CSA: Monitoring radiation for astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp)
