import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Keep the framework, the router and the data client in their own long-lived
    // chunks. They rarely change, so repeat visits re-download only app code.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("react-router") || id.includes("@remix-run")) return "router";
          if (id.includes("/react-dom/") || id.includes("/react/") ||
              id.includes("scheduler")) return "react";
          if (id.includes("date-fns") || id.includes("lucide-react") ||
              id.includes("clsx") || id.includes("tailwind-merge") ||
              id.includes("class-variance-authority")) return "ui";
        },
      },
    },
  },
});