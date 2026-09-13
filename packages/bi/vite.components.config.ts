import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist-components",
    emptyOutDir: true,
    assetsInlineLimit: process.env.CRYSTRA_PREVIEW_ENTRY ? Infinity : 4096,
    rollupOptions: {
      output: process.env.CRYSTRA_PREVIEW_ENTRY ? { codeSplitting: false } : undefined,
      input: process.env.CRYSTRA_PREVIEW_ENTRY ?? "components.html",
    },
  },
});
