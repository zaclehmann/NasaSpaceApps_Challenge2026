// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/app.css";
import App from "./App";
import { pickSource } from "./data/pickSource";

// Fires once if the onboard server stops answering during the visit; DataProvider then switches to local mode.
const dropListeners = new Set<() => void>();
const fallback = { subscribe: (cb: () => void) => void dropListeners.add(cb) };

// Pick the data source first (at most about 3 seconds when the server is unreachable), then render.
void pickSource(() => dropListeners.forEach((l) => l())).then((source) => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App source={source} fallback={fallback} />
    </StrictMode>,
  );
});
