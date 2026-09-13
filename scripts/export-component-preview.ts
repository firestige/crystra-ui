/** Export a self-contained review artifact; no runtime CDN or file:// module fetches. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
const root = resolve(import.meta.dirname, "../packages/bi/dist-components");
let html = readFileSync(
  resolve(root, process.argv[3] ?? "components.html"),
  "utf8",
);
html = html.replace(
  /<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g,
  (_, src: string) =>
    `<script type="module">${readFileSync(resolve(root, src.replace(/^\//, "")), "utf8").replace(/<\/script/gi, "<\\/script")}</script>`,
);
html = html.replace(
  /<link\b[^>]*href="([^"]+\.css)"[^>]*>/g,
  (_, src: string) =>
    `<style>${readFileSync(resolve(root, src.replace(/^\//, "")), "utf8")}</style>`,
);
const target = resolve(
  process.argv[2] ??
    "../docs/design/crystra-ui/assets/component-preview.html",
);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, html);
console.log(target);
