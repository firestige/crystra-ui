import { build } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(
  process.argv[2] ?? resolve(tmpdir(), "crystra-analysis-exploration"),
);
await build({
  root: resolve(root, "packages/bi"),
  configFile: resolve(root, "packages/bi/vite.config.ts"),
  build: {
    outDir,
    emptyOutDir: false,
    lib: {
      entry: resolve(
        root,
        "packages/bi/src/test-harness/analysis-exploration.tsx",
      ),
    },
  },
});
