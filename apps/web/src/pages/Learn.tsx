// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Learn (ui.md 5.10): one section per hazard, with the NASA risks it drives and the indicators used for them.
import { useNavigate } from "react-router-dom";
import { HAZARDS, HRP_HAZARDS_URL, HRP_RISKS_URL, INDICATORS, REGIONS, REGION_GUIDANCE, SOURCES, type Hazard } from "@missionvitals/shared";
import { AppShell } from "../components/layout/AppShell";
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
  return (
    <main className="mx-auto w-full max-w-[680px] min-w-0 flex-1 px-4 py-8">
      <h1 className="type-title">How spaceflight affects your health</h1>
      <p className="mt-3 type-body">
        NASA's Human Research Program groups the dangers of spaceflight into{" "}
        <a className="text-link underline underline-offset-2" href={HRP_HAZARDS_URL} target="_blank" rel="noreferrer">
          five hazards
        </a>
        . Each one drives some of the{" "}
        <a className="text-link underline underline-offset-2" href={HRP_RISKS_URL} target="_blank" rel="noreferrer">
          risks NASA tracks
        </a>
        . This page shows which readings in MissionVitals relate to each hazard.
      </p>
      {HAZARDS.map((h) => {
        const regions = REGIONS.filter((r) => REGION_GUIDANCE[r.id].hazards.includes(h));
        const risks = [...new Set(regions.flatMap((r) => r.risks))];
        const indicators = [...new Set(regions.flatMap((r) => r.indicators))];
        return (
          <section key={h} className="mt-10 border-t border-border pt-6">
            <h2 className="type-section">{h}</h2>
            <p className="mt-2 type-body">{INTRO[h]}</p>
            <p className="mt-2 type-body text-muted-foreground">TODO(Zac): two or three sentences on how this hazard is felt day to day on a long mission, in your own words.</p>
            <h3 className="mt-5 type-label text-muted-foreground">NASA risks it drives</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 type-small">
              {risks.map((r) => (
                <li key={r}>
                  <a className="text-link underline underline-offset-2" href={HRP_RISKS_URL} target="_blank" rel="noreferrer">
                    {r}
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="mt-5 type-label text-muted-foreground">What MissionVitals uses</h3>
            <p className="mt-1 type-small">{indicators.length ? indicators.map((k) => INDICATORS[k].name).join(", ") : "Nothing measured directly in this prototype."}</p>
            <h3 className="mt-5 type-label text-muted-foreground">Body regions</h3>
            <ul className="mt-1 flex flex-wrap gap-x-4">
              {regions.map((r) => (
                <li key={r.id}>
                  {astronaut ? (
                    <button
                      type="button"
                      className="min-h-12 type-small font-medium underline underline-offset-4 xl:min-h-8"
                      onClick={() => {
                        select({ kind: "region", id: r.id });
                        navigate("/?tab=body");
                      }}
                    >
                      {r.name}
                    </button>
                  ) : (
                    <span className="type-small">{r.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <footer className="mt-10 border-t border-border pt-4 type-caption text-subtle-foreground">
        Sources:{" "}
        {Object.values(SOURCES).map((s, i) => (
          <span key={s.url}>
            {i > 0 && ", "}
            <a className="text-link underline underline-offset-2" href={s.url} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          </span>
        ))}
        . Not medical advice.
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
