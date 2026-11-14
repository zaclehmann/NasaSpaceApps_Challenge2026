// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Learn (ui.md 5.10): one section per hazard, with the NASA risks it drives and the readings used for them.
import { useNavigate } from "react-router-dom";
import { HAZARDS, HRP_HAZARDS_URL, HRP_RISKS_URL, INDICATORS, REGIONS, REGION_GUIDANCE, SOURCES, type Hazard } from "@missionvitals/shared";
import { AppShell } from "../components/layout/AppShell";
import { Todo } from "../components/ui/Todo";
import { useAstronaut } from "../data/DataProvider";
import { useUi } from "../state/ui";

/** One supported sentence per hazard, from the NASA hazards page. Longer text is still to be written. */
const INTRO: Record<Hazard, string> = {
  "Space radiation": "NASA considers space radiation one of the most hazardous aspects of spaceflight, and it is invisible to the human eye.",
  "Isolation and confinement": "A small crew lives and works in a confined space for a long time, and NASA studies the behavioural responses that follow.",
  "Distance from Earth": "The further a crew travels, the harder it is to receive supplies, instructions and medical care from Earth, so planning and self-sufficiency are key.",
  "Gravity fields": "Muscles, bones, the inner ear and organs all have to adjust each time the level of gravity changes.",
  "Hostile/closed environments": "The habitat's temperature, pressure, lighting, noise and microbes all have to be managed, and immune responses tracked.",
};

function Content() {
  const navigate = useNavigate();
  const astronaut = useAstronaut();
  const { select } = useUi();
  const link = "text-link underline underline-offset-2";
  return (
    <main className="mx-auto w-full max-w-[960px] min-w-0 flex-1 px-4 py-8 md:px-6">
      <h1 className="type-title">How spaceflight affects your health</h1>
      <p className="mt-2 max-w-[68ch] type-body">
        NASA's Human Research Program groups the dangers of spaceflight into{" "}
        <a className={link} href={HRP_HAZARDS_URL} target="_blank" rel="noreferrer">
          five hazards
        </a>
        . Each one drives some of the{" "}
        <a className={link} href={HRP_RISKS_URL} target="_blank" rel="noreferrer">
          risks NASA tracks
        </a>
        . This page shows which readings in MissionVitals relate to each hazard.
      </p>
      <div className="mt-8 border-b border-border">
        {HAZARDS.map((h) => {
          const regions = REGIONS.filter((r) => REGION_GUIDANCE[r.id].hazards.includes(h));
          const risks = [...new Set(regions.flatMap((r) => r.risks))];
          const indicators = [...new Set(regions.flatMap((r) => r.indicators))];
          return (
            <section key={h} className="grid gap-x-10 gap-y-3 border-t border-border py-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
              <div>
                <h2 className="type-section">{h}</h2>
                <p className="mt-1.5 type-small">{INTRO[h]}</p>
                <Todo>two or three sentences on how this hazard is felt day to day on a long mission, in your own words.</Todo>
              </div>
              <dl className="grid grid-cols-[104px_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2 type-small">
                <dt className="text-muted-foreground">NASA risks</dt>
                <dd>
                  <ul className="space-y-0.5">
                    {risks.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </dd>
                <dt className="text-muted-foreground">Readings</dt>
                <dd>{indicators.length ? indicators.map((k) => INDICATORS[k].name).join(", ") : "Not measured directly in this prototype"}</dd>
                <dt className="text-muted-foreground">Body regions</dt>
                <dd className="flex flex-wrap gap-x-3">
                  {regions.map((r) =>
                    astronaut ? (
                      <button
                        key={r.id}
                        type="button"
                        className="relative inline-flex min-h-6 items-center font-medium underline decoration-border-strong underline-offset-4 hover:decoration-foreground max-xl:before:absolute max-xl:before:inset-x-0 max-xl:before:-inset-y-3 max-xl:before:content-['']"
                        onClick={() => {
                          select({ kind: "region", id: r.id });
                          navigate("/?tab=body");
                        }}
                      >
                        {r.name}
                      </button>
                    ) : (
                      <span key={r.id}>{r.name}</span>
                    ),
                  )}
                </dd>
              </dl>
            </section>
          );
        })}
      </div>
      <footer className="pt-4 type-caption text-subtle-foreground">
        Sources:{" "}
        {Object.values(SOURCES).map((s, i) => (
          <span key={s.url}>
            {i > 0 && ", "}
            <a className="underline underline-offset-2 hover:text-foreground" href={s.url} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          </span>
        ))}
        . Risk names are NASA's. Not medical advice.
      </footer>
    </main>
  );
}

export default function Learn() {
  return (
    <AppShell>
      <Content />
    </AppShell>
  );
}
