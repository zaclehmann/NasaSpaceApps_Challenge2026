// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Demo controls (ui.md 5.10). Scenarios change the simulated data itself, not only the display.
import clsx from "clsx";
import { MISSION_SETTINGS, SCENARIOS, formatDelay } from "@missionvitals/shared";
import { useAstronaut, useCrew, useData, useMission } from "../../data/DataProvider";
import { resetAttention } from "../../state/attention";
import { useUi } from "../../state/ui";
import { useThemeChoice, type ThemeChoice } from "../../theme/useTheme";
import { Scale } from "../ui/Scale";
import { Sheet } from "../ui/Sheet";
import { Switch } from "../ui/Switch";

const THEMES: ThemeChoice[] = ["system", "light", "dark"];

function RadioRow({ name, checked, onChange, title, description }: { name: string; checked: boolean; onChange: () => void; title: string; description?: string }) {
  return (
    <label className={clsx("flex min-h-12 cursor-pointer items-start gap-3 py-2.5 type-small", checked && "font-medium")}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-0.5 size-4 shrink-0 accent-(--foreground)" />
      <span className="min-w-0">
        <span className="block">{title}</span>
        {description && <span className="block type-caption font-normal text-subtle-foreground">{description}</span>}
      </span>
    </label>
  );
}

export function DemoSheet() {
  const { demoOpen, setDemoOpen, resetSelection } = useUi();
  const { source, setAstronautId } = useData();
  const mission = useMission();
  const crew = useCrew();
  const astronaut = useAstronaut();
  const [theme, setTheme] = useThemeChoice();
  const target = astronaut?.id ?? mission.scenarioTarget;
  const targetName = crew.find((c) => c.id === target)?.name ?? "";
  return (
    <Sheet open={demoOpen} onOpenChange={setDemoOpen} title="Demo controls" description="Simulated data">
      <div className="space-y-6">
        <fieldset>
          <legend className="type-small font-semibold">Scenario</legend>
          <p className="type-caption text-subtle-foreground">Applies to {targetName}. Radiation applies to the whole crew. Choosing a scenario resets entered readings.</p>
          <div className="mt-1 divide-y divide-border">
            {SCENARIOS.map((s) => (
              <RadioRow
                key={s.id}
                name="scenario"
                checked={mission.scenario === s.id && mission.scenarioTarget === target}
                onChange={() => {
                  resetSelection();
                  // A new scenario starts fresh: its due checks pulse and ring again.
                  resetAttention();
                  source.setScenario(s.id, target);
                }}
                title={`${s.number}. ${s.name}`}
                description={s.description}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="type-small font-semibold">Mission setting</legend>
          <p className="type-caption text-subtle-foreground">Changes the mission name and the Earth link delay only. Simulated values.</p>
          <div className="mt-1 divide-y divide-border">
            {MISSION_SETTINGS.map((m) => (
              <RadioRow
                key={m.id}
                name="mission-setting"
                checked={mission.setting === m.id}
                onChange={() => source.setMissionSetting(m.id)}
                title={m.label}
                description={`${m.missionName}. Earth link delay ${formatDelay(m.delaySec)} one way${m.delaySec < 10 ? ", near real-time" : ""}.`}
              />
            ))}
          </div>
        </fieldset>

        <section className="divide-y divide-border">
          <Switch label="Earth link" description={mission.earthLink.up ? "Up. Reports send straight away." : "Down. Reports wait in the queue."} checked={mission.earthLink.up} onChange={(v) => source.setEarthLink(v)} />
          <Switch label="Crew sleep period" description="Switches to dark mode unless you chose a theme." checked={mission.sleepPeriod} onChange={(v) => source.setSleepPeriod(v)} />
        </section>

        <Scale legend="Theme" labels={["System", "Light", "Dark"]} value={THEMES.indexOf(theme) + 1} onChange={(v) => setTheme(THEMES[v - 1])} />

        <fieldset>
          <legend className="type-small font-semibold">Astronaut</legend>
          <div className="mt-1 divide-y divide-border">
            {crew.map((c) => (
              <RadioRow
                key={c.id}
                name="astronaut"
                checked={astronaut?.id === c.id}
                onChange={() => {
                  resetSelection();
                  setAstronautId(c.id);
                }}
                title={c.name}
                description={c.role}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </Sheet>
  );
}
