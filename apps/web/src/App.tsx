// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { RouterProvider } from "react-router-dom";
import { DataProvider, useMission } from "./data/DataProvider";
import { router } from "./routes";
import { UiProvider } from "./state/ui";
import { useApplyTheme } from "./theme/useTheme";

function Themed() {
  const mission = useMission();
  useApplyTheme(mission.sleepPeriod);
  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <DataProvider>
      <UiProvider>
        <Themed />
      </UiProvider>
    </DataProvider>
  );
}
