// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { installClickFeedback } from "./audio/clickFeedback";
import { DataProvider, useMission } from "./data/DataProvider";
import type { DataSource } from "./data/DataSource";
import { ConnectionNotice } from "./components/layout/ConnectionNotice";
import { router } from "./routes";
import { UiProvider } from "./state/ui";
import { useApplyTheme } from "./theme/useTheme";

function Themed() {
  const mission = useMission();
  useApplyTheme(mission.sleepPeriod);
  // A key tick (and a short vibration on touch) on every control press, app-wide.
  useEffect(() => installClickFeedback(), []);
  return <RouterProvider router={router} />;
}

export default function App({ source, fallback }: { source?: DataSource; fallback?: { subscribe: (cb: () => void) => void } }) {
  return (
    <DataProvider source={source} fallback={fallback}>
      <UiProvider>
        <ConnectionNotice />
        <Themed />
      </UiProvider>
    </DataProvider>
  );
}
