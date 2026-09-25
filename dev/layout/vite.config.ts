import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { taskQueryDevHost } from "./task-query-dev-host";
import { fileURLToPath } from "node:url";

const env = loadEnv(
  "development",
  fileURLToPath(new URL(".", import.meta.url)),
  "CRYSTRA_",
);
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [
    react(),
    tailwindcss(),
    taskQueryDevHost(
      process.env.CRYSTRA_EXECUTION_CONFIG ?? env.CRYSTRA_EXECUTION_CONFIG,
      process.env.CRYSTRA_WORKFLOW_BINDINGS ??
        env.CRYSTRA_WORKFLOW_BINDINGS ??
        fileURLToPath(
          new URL("workflow-directories.local.json", import.meta.url),
        ),
    ),
  ],
  resolve: {
    alias: [
      {
        find: /^crystra-ui-core$/,
        replacement: fileURLToPath(
          new URL("../../packages/bi/src/public.ts", import.meta.url),
        ),
      },
    ],
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: "127.0.0.1",
    port: 3086,
    strictPort: true,
    proxy: {
      "/crystra-tasks": {
        target: process.env.CRYSTRA_EXECUTION_ORIGIN ?? "http://127.0.0.1:3085",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("proxyReq", (request) => {
            request.setHeader(
              "Origin",
              process.env.CRYSTRA_EXECUTION_ORIGIN ?? "http://127.0.0.1:3085",
            );
          });
        },
      },
    },
    fs: {
      allow: [
        fileURLToPath(
          new URL(
            "../../../wsr-contracts/docs/proposals/plan-json-ir",
            import.meta.url,
          ),
        ),
        "/Users/firestige/Projects/wsr-dsh/src/client",
        fileURLToPath(new URL("../..", import.meta.url)),
        "/Users/firestige/Projects/workflow-self-recursive/tmp/20260907/Crystra-ui-design/assets",
      ],
    },
  },
});
