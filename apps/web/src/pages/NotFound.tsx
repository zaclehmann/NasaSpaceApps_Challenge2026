// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Unknown routes: one plain sentence and a way back, in the same shell as every other page.
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[960px] min-w-0 flex-1 px-4 py-8 md:px-6">
        <h1 className="type-title">This page doesn't exist.</h1>
        <Link to="/" className="mt-4 inline-flex min-h-12 items-center type-small font-medium text-link underline underline-offset-4">
          Back to My Health
        </Link>
      </main>
    </AppShell>
  );
}
