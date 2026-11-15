// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Demo links: ?astronaut=hana&scenario=low-spo2. The scenario is applied only when it differs from the session's
// current one (the first visit, or a real change of link). Choosing a scenario resets entered readings, so applying
// it on every reload would wipe what a judge just entered; in server mode the session keeps its scenario.
import { SCENARIOS, type ScenarioId } from "@missionvitals/shared";
import type { DataSource } from "./DataSource";

/** Applies the link's scenario if it's a change, and returns the astronaut to open (or null for the picker). */
export function applyUrlParams(source: DataSource, search: string = window.location.search): string | null {
  const p = new URLSearchParams(search);
  const astronaut = p.get("astronaut");
  const scenario = p.get("scenario") as ScenarioId | null;
  const crew = source.getCrew();
  const validAstronaut = astronaut && crew.some((c) => c.id === astronaut) ? astronaut : null;
  if (scenario && SCENARIOS.some((s) => s.id === scenario)) {
    const mission = source.getMission();
    const target = validAstronaut ?? mission.scenarioTarget;
    if (scenario !== mission.scenario || target !== mission.scenarioTarget) source.setScenario(scenario, target);
  }
  return validAstronaut;
}
