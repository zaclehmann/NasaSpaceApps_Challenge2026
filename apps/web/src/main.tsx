// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/app.css";
import App from "./App";
import { ConnectingShell } from "./components/layout/ConnectingShell";
import { pickSource } from "./data/pickSource";

// Fires once if the onboard server stops answering during the visit; DataProvider then switches to local mode.
const dropListeners = new Set<() => void>();
const fallback = { subscribe: (cb: () => void) => void dropListeners.add(cb) };

const root = createRoot(document.getElementById("root")!);
// Something on screen at once: the header and "Connecting to the onboard server…".
root.render(<ConnectingShell />);
// Then the app, on the server's data or in local mode, within 4 seconds of page load.
void pickSource(() => dropListeners.forEach((l) => l())).then((source) => {
  root.render(
    <StrictMode>
      <App source={source} fallback={fallback} />
    </StrictMode>,
  );
});
