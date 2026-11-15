// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // /api goes to the local API server (npm run dev:api). If it isn't running, the app falls back to local mode.
  server: { port: 5173, proxy: { "/api": { target: "http://localhost:3001", changeOrigin: false } } },
});
