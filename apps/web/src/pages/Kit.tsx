// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Temporary /kit route: every token, badge, button and input in light and dark, for review.
import clsx from "clsx";
import { useState } from "react";
import { STATUSES } from "@missionvitals/shared";
import { StatusBadge } from "../components/status/StatusBadge";
import { STATUS_TINT } from "../components/status/statusStyles";
import { Button } from "../components/ui/Button";
import { NumericInput } from "../components/ui/NumericInput";
import { Scale } from "../components/ui/Scale";
import { ToggleTag } from "../components/ui/ToggleTag";
import { Tabs } from "../components/ui/Tabs";

const SWATCHES: [string, string][] = [
  ["background", "bg-background"],
  ["card", "bg-card"],
  ["muted", "bg-muted"],
  ["secondary", "bg-secondary"],
  ["accent", "bg-accent"],
  ["figure", "bg-figure"],
  ["border", "bg-border"],
  ["border-strong", "bg-border-strong"],
  ["primary", "bg-primary"],
  ["foreground", "bg-foreground"],
  ["muted-foreground", "bg-muted-foreground"],
  ["subtle-foreground", "bg-subtle-foreground"],
  ["link", "bg-link"],
  ["ok", "bg-ok"],
  ["watch", "bg-watch"],
  ["caution", "bg-caution"],
  ["warning", "bg-warning"],
  ["nodata", "bg-nodata"],
  ["watch-tint", "bg-watch-tint"],
  ["caution-tint", "bg-caution-tint"],
  ["warning-tint", "bg-warning-tint"],
];

const MOOD = ["Very low", "Low", "Okay", "Good", "Very good"] as const;

function KitColumn({ dark }: { dark: boolean }) {
  const [mood, setMood] = useState<number | null>(3);
  const [tags, setTags] = useState<string[]>(["Tired"]);
  const [tab, setTab] = useState<"1h" | "24h" | "7d" | "30d">("24h");
  const [sys, setSys] = useState("128");
  return (
    <section className={clsx(dark && "dark", "min-w-0 flex-1 bg-background p-6 text-foreground")}>
      <h2 className="type-title">{dark ? "Dark" : "Light"}</h2>

      <h3 className="mt-8 type-section">Tokens</h3>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {SWATCHES.map(([name, cls]) => (
          <li key={name} className="flex items-center gap-2 type-small">
            <span className={clsx("size-6 shrink-0 rounded-sm border border-border", cls)} />
            {name}
          </li>
        ))}
      </ul>

      <h3 className="mt-8 type-section">Status badges</h3>
      <ul className="mt-3 divide-y divide-border">
        {STATUSES.map((s) => (
          <li key={s} className={clsx("flex items-center justify-between px-3 py-3", STATUS_TINT[s])}>
            <StatusBadge status={s} className="type-small" />
            <span className="type-caption text-subtle-foreground">Row tint {STATUS_TINT[s] ? "on" : "none"}</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 type-section">Type</h3>
      <div className="mt-3 space-y-2">
        <p className="type-title">Page title 26</p>
        <p className="type-summary">1 caution needs you: heart rate.</p>
        <p className="type-section">Section 17</p>
        <p className="type-body">Body 15. Heart rate above 110 bpm for 9 minutes. Rest and re-measure.</p>
        <p className="type-small">Small 14 for lists and panels.</p>
        <p className="type-label text-muted-foreground">Label 13</p>
        <p className="type-caption text-subtle-foreground">Caption 12, MET 141d 14:32</p>
        <p>
          <span className="type-value-xl">119</span> <span className="type-label text-muted-foreground">bpm</span>
        </p>
        <p>
          <span className="type-value">36.7</span> <span className="type-label text-muted-foreground">°C</span>
        </p>
        <p className="type-small">
          An inline <a className="text-link underline underline-offset-2" href="https://www.nasa.gov/hrp/risks/">text link</a> in prose.
        </p>
      </div>

      <h3 className="mt-8 type-section">Buttons</h3>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="primary">Save reading</Button>
        <Button>Re-measure</Button>
        <Button variant="text">Switch</Button>
        <Button variant="secondary" size="sm">Demo</Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </div>

      <h3 className="mt-8 type-section">Inputs</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <NumericInput label="Systolic" unit="mmHg" value={sys} onChange={setSys} />
        <NumericInput label="Diastolic" unit="mmHg" value="300" onChange={() => {}} error="Diastolic must be between 30 and 150 mmHg" />
      </div>
      <div className="mt-4">
        <Scale legend="How is your mood today?" labels={MOOD} value={mood} onChange={setMood} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {["Tired", "Lonely", "Irritable", "Unfocused", "Motivated", "Connected"].map((t) => (
          <ToggleTag key={t} label={t} on={tags.includes(t)} onToggle={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} />
        ))}
      </div>
      <div className="mt-4">
        <Tabs
          label="Chart window"
          value={tab}
          onChange={setTab}
          items={[
            { value: "1h", label: "1 h" },
            { value: "24h", label: "24 h" },
            { value: "7d", label: "7 d" },
            { value: "30d", label: "30 d" },
          ]}
        />
      </div>
      <div className="mt-6 rounded-lg border border-border bg-card p-4 type-small">Detail panel surface, radius 8</div>
      <div className="mt-4 rounded-xl bg-card p-4 type-small shadow-float">Sheet or dialog surface, radius 12, shadow-float</div>
    </section>
  );
}

export default function Kit() {
  return (
    <main className="flex min-h-dvh flex-col lg:flex-row">
      <KitColumn dark={false} />
      <KitColumn dark />
    </main>
  );
}
