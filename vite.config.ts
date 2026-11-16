import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // Deno's Edge Function test runner can resolve a second Vite copy; runtime plugins remain compatible.
  plugins: [react() as unknown as PluginOption, mode === "development" && componentTagger() as unknown as PluginOption].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
