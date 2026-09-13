import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { compile } from "@tailwindcss/node";
const source = resolve(import.meta.dirname, "../packages/bi/src");
const css = readFileSync(resolve(source, "crystra-components.css"), "utf8");
const compiler = await compile(css, { base: source, onDependency: () => {} });
const target = resolve(
  process.argv[2] ?? "../docs/design/crystra-ui/assets/component-recipes.css",
);
writeFileSync(
  target,
  readFileSync(resolve(source, "crystra-theme.css"), "utf8") +
    "\n" +
    compiler.build([]),
);
console.log(target);
