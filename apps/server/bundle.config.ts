// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Bundles the API (server code, shared code, zod and supabase-js) into one ES module, api/_server.mjs, so the
// Vercel function needs no TypeScript or workspace resolution at deploy time. Files in api/ starting with "_"
// are not functions. Run with: npm run build:api (part of npm run build).
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  root,
  logLevel: "warn",
  build: {
    ssr: fileURLToPath(new URL("./src/vercel.ts", import.meta.url)),
    outDir: fileURLToPath(new URL("../../api", import.meta.url)),
    emptyOutDir: false,
    target: "node20",
    minify: false,
    rollupOptions: { output: { entryFileNames: "_server.mjs", format: "es", codeSplitting: false } },
  },
  ssr: { noExternal: true, target: "node" },
});
