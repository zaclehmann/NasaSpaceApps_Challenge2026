// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The in-browser data source (local mode): the shared session engine on the wall clock, with a 5-second tick.
// All logic and state live in packages/shared/src/sim/engine.ts, which the server runs too. All data is simulated.
import { MET_AT_LOAD, SessionEngine, TICK_SEC } from "@missionvitals/shared";
import type { DataSource } from "./DataSource";

export { MET_AT_LOAD };

export class MockSource extends SessionEngine implements DataSource {
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    const wallStart = Date.now();
    super(() => MET_AT_LOAD + (Date.now() - wallStart) / 1000);
    this.onChange = () => {
      for (const l of this.listeners) l();
    };
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    if (!this.timer) this.timer = setInterval(() => this.tick(), TICK_SEC * 1000);
    return () => {
      this.listeners.delete(callback);
      if (!this.listeners.size && this.timer) {
        clearInterval(this.timer);
        this.timer = undefined;
      }
    };
  }
}

export const mockSource = new MockSource();
