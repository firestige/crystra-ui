import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^crystra-ui-core$/,
        replacement: fileURLToPath(
          new URL("./packages/bi/src/public.ts", import.meta.url),
        ),
      },
    ],
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    exclude: [
      "tests/browser/**",
      "scripts/**/*.test.mjs",
      "qualification/**/*.test.mjs",
      "**/node_modules/**",
      "**/dist/**",
    ],
    setupFiles: "./packages/bi/src/test/setup.ts",
  },
});
