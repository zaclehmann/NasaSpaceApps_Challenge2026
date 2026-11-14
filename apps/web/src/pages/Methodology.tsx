// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Methodology (ui.md 5.10): how the prototype works and where its limits are. Geist Mono is allowed here for raw values.
import type { ReactNode } from "react";
import { INDICATORS, INDICATOR_KEYS, SCENARIOS, SOURCES, STATUSES } from "@missionvitals/shared";
import { AppShell } from "../components/layout/AppShell";
import { StatusBadge } from "../components/status/StatusBadge";
import { Todo } from "../components/ui/Todo";

const H2 = ({ children }: { children: ReactNode }) => <h2 className="mt-8 border-t border-border pt-5 type-section">{children}</h2>;
const P = ({ children }: { children: ReactNode }) => <p className="mt-2 max-w-[72ch] type-small">{children}</p>;
const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a className="text-link underline underline-offset-2" href={href} target="_blank" rel="noreferrer">
    {children}
  </a>
);

const PALETTE = [
  { palette: "First proposal", mode: "Light", values: "#16A34A #EAB308 #F97316 #DC2626", cvd: "Fail: orange vs green ΔE 4.8 (protan)", floor: "Fail: yellow vs orange ΔE 14.8", result: "Fail" },
  { palette: "First proposal", mode: "Dark", values: "dark variant", cvd: "Warn: ΔE 7.0", floor: "Fail: ΔE 14.6", result: "Fail" },
  { palette: "Chosen", mode: "Light", values: "#15803D #0EA5E9 #F59E0B #DC2626", cvd: "Pass: worst ΔE 8.6", floor: "Pass: worst ΔE 24.1", result: "All checks pass" },
  { palette: "Chosen", mode: "Dark", values: "#16A34A #38BDF8 #FBBF24 #F87171", cvd: "Warn: ΔE 7.4", floor: "Pass: ΔE 21.2", result: "Pass with shape and word" },
];

function Content() {
  return (
    <main className="mx-auto w-full max-w-[760px] min-w-0 flex-1 px-4 py-8">
      <h1 className="type-title">Methodology</h1>
      <P>MissionVitals is a prototype for the NASA Space Apps Challenge 2026. Everything on screen is simulated. It is not a medical device and gives no medical advice.</P>

      <H2>Data sources</H2>
      <P>
        Three kinds of reading, grouped the same way on the main screen: live from a wearable shirt (heart rate and SpO₂), entered by the astronaut (blood pressure, temperature, blood glucose, sleep, exercise and
        mood) and from the habitat (radiation dose rate, the same for the whole crew).
      </P>
      <P>
        The shirt is modelled on the Canadian Space Agency's <A href={SOURCES.bioMonitor.url}>Bio-Monitor</A>, a smart shirt and headband that measures heart activity, blood pressure, breathing, skin temperature, blood oxygen
        and physical activity.
      </P>
      <P>
        The Bio-Monitor measures skin temperature, which reads lower than core body temperature. The temperature ranges here are for core temperature, so temperature is a thermometer reading, entered each morning and
        whenever the astronaut feels unwell. Exercise minutes come from the shirt's activity sensor and are confirmed by the astronaut.
      </P>
      <Todo>one paragraph on why these nine indicators were chosen for the challenge brief.</Todo>

      <H2>Simulation</H2>
      <P>
        All data comes from a seeded generator, so every load shows the same data. Live signals are a baseline for each astronaut, plus a daily rhythm, a slow drift that pulls back toward the baseline, and small noise. Live
        signals update every 5 seconds and the dosimeter every minute. Each astronaut has 30 days of history.
      </P>
      <P>Seven scenarios change the simulated data itself:</P>
      <ol className="mt-2 list-decimal space-y-1 pl-5 type-small">
        {SCENARIOS.map((s) => (
          <li key={s.id}>
            <span className="font-medium">{s.name}.</span> {s.description}
          </li>
        ))}
      </ol>
      <P>
        The Mission setting in Demo controls (Mars transit, space station, lunar base, Mars rover) changes only the mission name and the simulated one-way Earth link delay: 6 min 48 s for Mars, about 1.3 s for the Moon
        and about 0.3 s for a station in low Earth orbit. Thresholds and data stay the same.
      </P>

      <H2>Status and alert rules</H2>
      <ul className="mt-3 space-y-2 type-small">
        {STATUSES.map((s) => (
          <li key={s} className="flex flex-wrap gap-x-3">
            <StatusBadge status={s} className="w-24" />
            <span className="min-w-0 flex-1">
              {s === "ok" && "Inside the demo range."}
              {s === "watch" && "In range, but within a fixed margin of a limit and moving toward it, or a routine measurement is more than an hour overdue."}
              {s === "caution" && "Outside the demo range. Needs attention, not immediate action."}
              {s === "warning" && "Outside the critical demo range. Act now."}
              {s === "nodata" && "A live sensor silent for three times its expected interval, or a daily measurement not done by the end of the day."}
            </span>
          </li>
        ))}
        <li className="flex flex-wrap gap-x-3">
          <span className="w-24 text-muted-foreground">Due</span>
          <span className="min-w-0 flex-1">A daily measurement not taken yet, up to an hour after its routine time. Shown as plain text, with no badge or colour.</span>
        </li>
      </ul>
      <P>
        Caution and Warning are NASA's own alert words for crewed vehicles. Watch is this prototype's word for the lowest level. A value is classified after rounding to the precision shown on screen, so a number and its
        status never disagree.
      </P>
      <P>
        Watch uses a fixed margin inside each demo limit: heart rate 6 bpm, SpO₂ 1 %, temperature 0.3 °C, blood pressure 10 mmHg systolic and 5 mmHg diastolic, blood glucose 10 mg/dL, sleep 0.5 h,
        exercise 15 min and radiation 2 µGy/h. "Moving toward the limit" means over the last hour for live readings (the last 10 minutes against 50 to 70 minutes ago) and over the last 3 days for entered ones. A
        percentage margin was tried first and rejected: 10% of the SpO₂ limit would cover every normal reading.
      </P>
      <P>Blood glucose is judged against the range for when it was taken: 70 to 110 mg/dL fasting or before a meal, and 70 to 140 mg/dL after a meal. The caution and warning bands are the same for both.</P>
      <P>A new blood pressure, glucose, sleep or mood reading taken during an alert is logged on that alert as a re-measure. To keep noise from firing alerts, a live value must stay out of range for 60 seconds before an alert fires, and stay clear for 60 seconds before it ends. Acknowledging an alert quiets it without hiding it.</P>

      <H2>Demo thresholds</H2>
      <P>Every range below is a demo value chosen for this prototype. None of them is a NASA limit or clinical guidance.</P>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] type-small">
          <thead className="bg-muted type-label text-muted-foreground">
            <tr>
              {["Indicator", "Unit", "In range (demo)", "Caution (demo)", "Warning (demo)"].map((h) => (
                <th key={h} scope="col" className="px-3 py-2.5 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {INDICATOR_KEYS.map((k) => {
              const d = INDICATORS[k];
              return (
                <tr key={k} className="h-12">
                  <th scope="row" className="px-3 py-2 text-left font-medium">
                    {d.name}
                  </th>
                  <td className="px-3 py-2 text-muted-foreground">{d.tableUnit ?? d.unit}</td>
                  <td className="px-3 py-2 font-mono text-[13px]">{d.table.inRange}</td>
                  <td className="px-3 py-2 font-mono text-[13px]">{d.table.caution}</td>
                  <td className="px-3 py-2 font-mono text-[13px]">{d.table.warning}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <H2>Status colour validation</H2>
      <P>
        Status is never colour alone: each state has its own shape and its word is always printed. The colours were still checked for people with colour-blindness, using an all-pairs ΔE check. The first red, orange, yellow
        and green proposal failed, so Watch became blue, which the medical alarm standard IEC 60601-1-8 allows for low priority.
      </P>
      <P>{"Exception: the routine Start (green) and Postpone (red) buttons use status colours on purpose, so a due check stands out; they never appear for indicator status."}</P>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] type-small">
          <thead className="bg-muted type-label text-muted-foreground">
            <tr>
              {["Palette", "Mode", "Colour-blind separation", "Normal-vision floor", "Result"].map((h) => (
                <th key={h} scope="col" className="px-3 py-2.5 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PALETTE.map((r) => (
              <tr key={r.palette + r.mode} className="h-12">
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  <span className="font-medium">{r.palette}</span>
                  <span className="block font-mono text-[12px] text-muted-foreground">{r.values}</span>
                </th>
                <td className="px-3 py-2">{r.mode}</td>
                <td className="px-3 py-2">{r.cvd}</td>
                <td className="px-3 py-2">{r.floor}</td>
                <td className="px-3 py-2 font-medium">{r.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Limitations</H2>
      <ul className="mt-2 list-disc space-y-1 pl-5 type-small">
        <li>All data is simulated. No real sensor, astronaut or mission is involved.</li>
        <li>Thresholds are demo values, including the exercise target of 120 minutes a day.</li>
        <li>Guidance covers re-measuring, habits, mission procedure and escalation only. It does not diagnose.</li>
        <li>Eyes and inner ear are not measured. Temperature is only a fever check, not a measure of the immune system. Exercise minutes stand in for bone and muscle health, which is not measured directly.</li>
        <li>
          On a spacecraft this would run on an onboard server. The prototype runs in the browser with a simulated data source behind one interface, so a server could replace it without changing
          the screens. Data lives in memory and resets on reload.
        </li>
      </ul>
      <Todo>anything you learn from testing with other people.</Todo>

      <H2>AI use</H2>
      <P>
        The code for this interface was generated with Claude Code (Anthropic) and reviewed and edited by Zac Lehmann. The concept, scope and design decisions are Zac's. Each source file carries a comment saying so. Health
        guidance text was drafted with AI from the pages listed below and checked against them.
      </P>
      <Todo>confirm this statement matches the final submission form.</Todo>

      <H2>References</H2>
      <ul className="mt-2 list-disc space-y-1 pl-5 type-small">
        {Object.values(SOURCES).map((s) => (
          <li key={s.url}>
            <A href={s.url}>{s.label}</A>
          </li>
        ))}
        <li>
          <A href="https://ntrs.nasa.gov/api/citations/20240003565/downloads/CLD%20HSI%20Workshop%20Alerts.pdf">NASA: Commercial LEO Destinations HSI workshop, Alerts</A>
        </li>
        <li>
          <A href="https://standards.har-el.com/Projects/181701/60601-1-8/html/A2SubCl-6-3-2-2-Visual-Characteristics.htm">IEC 60601-1-8, visual alarm signal characteristics</A>
        </li>
        <li>
          <A href="https://21st.dev/@serafimcloud/themes/vercel">21st.dev Vercel theme</A> (theme tokens). Geist typeface, SIL Open Font License.
        </li>
      </ul>
    </main>
  );
}

export default function Methodology() {
  return (
    <AppShell>
      <Content />
    </AppShell>
  );
}
