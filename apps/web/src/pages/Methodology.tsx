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
        Three kinds of reading, grouped the same way on the main screen: live from a wearable shirt (heart rate, SpO₂, temperature), entered by the astronaut (blood pressure, blood glucose, sleep, mood) and from the habitat
        (radiation dose rate, the same for the whole crew).
      </P>
      <P>
        The shirt is modelled on the Canadian Space Agency's <A href={SOURCES.bioMonitor.url}>Bio-Monitor</A>, a smart shirt and headband that measures heart activity, blood pressure, breathing, skin temperature, blood oxygen
        and physical activity.
      </P>
      <Todo>one paragraph on why these eight indicators were chosen for the challenge brief.</Todo>

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

      <H2>Status and alert rules</H2>
      <ul className="mt-3 space-y-2 type-small">
        {STATUSES.map((s) => (
          <li key={s} className="flex flex-wrap gap-x-3">
            <StatusBadge status={s} className="w-24" />
            <span className="min-w-0 flex-1">
              {s === "ok" && "Inside the demo range."}
              {s === "watch" && "In range, but within 10% of a limit and moving toward it, or a routine measurement is overdue."}
              {s === "caution" && "Outside the demo range. Needs attention, not immediate action."}
              {s === "warning" && "Outside the critical demo range. Act now."}
              {s === "nodata" && "No reading for three times the expected interval, or a daily measurement not taken yet today."}
            </span>
          </li>
        ))}
      </ul>
      <P>
        Caution and Warning are NASA's own alert words for crewed vehicles. Watch is this prototype's word for the lowest level. A value is classified after rounding to the precision shown on screen, so a number and its
        status never disagree.
      </P>
      <P>
        Watch looks at the last hour for live signals (the mean of the last 10 minutes against 50 to 70 minutes ago) and at up to five earlier readings for entered ones. For SpO₂ and temperature, 10% of the limit would
        cover the whole healthy range, so the margin is 10% of the in-range span instead.
      </P>
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
                  <td className="px-3 py-2 text-muted-foreground">{k === "mood" ? "1 to 5" : d.unit}</td>
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
        <li>Thresholds are demo values. The blood glucose range is for fasting readings and is applied to every reading.</li>
        <li>Guidance covers re-measuring, habits, mission procedure and escalation only. It does not diagnose.</li>
        <li>Eyes, inner ear, immune system, and bones and muscles are not measured directly.</li>
        <li>There is no server yet. Data lives in memory and resets on reload.</li>
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
