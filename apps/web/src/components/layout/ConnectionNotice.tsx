// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Says once, as a toast, when the onboard server stops answering during the visit and the app switches to local
// mode. The header keeps showing the state (OnboardStatus); this only marks the moment it changed.
import { useEffect } from "react";
import { useConnection } from "../../data/connection";
import { useUi } from "../../state/ui";

export function ConnectionNotice() {
  const { droppedAt } = useConnection();
  const { showToast } = useUi();
  useEffect(() => {
    if (droppedAt) showToast("Onboard server unreachable. Switched to local mode.");
  }, [droppedAt, showToast]);
  return null;
}
