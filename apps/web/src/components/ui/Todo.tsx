// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// A note for text Zac still has to write. Shown only while developing (npm run dev),
// never in a production build, so a placeholder cannot reach the submitted app.
import type { ReactNode } from "react";

export function Todo({ children }: { children: ReactNode }) {
  if (!import.meta.env.DEV) return null;
  return <p className="mt-2 type-small text-subtle-foreground">TODO(Zac): {children}</p>;
}
