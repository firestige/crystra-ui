/** Export reviewed geometry values and the v8 layout adapter from the checked-in source. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { format } from "prettier";
const source = JSON.parse(
  readFileSync(
    new URL("../design/crystra.geometry.json", import.meta.url),
    "utf8",
  ),
) as { groups: Record<string, Record<string, string>> };
const target = resolve(process.argv[2] ?? "../docs/design/crystra-ui/assets");
mkdirSync(target, { recursive: true });
const scope = '.crystra-bi[data-crystra-theme="dark"]';
const declarations = Object.values(source.groups)
  .flatMap((group) =>
    Object.entries(group).map(([name, value]) => `--${name}: ${value};`),
  )
  .join("\n");
const css = `${scope} {${declarations}}
${scope} [data-section-id="control-workspace"]:not([data-host-owned], [data-host-owned] *) { padding:var(--layout-bench-inset-block) var(--layout-bench-inset-inline) var(--layout-bench-inset-end); }
`;
writeFileSync(
  resolve(target, "geometry.tokens.json"),
  JSON.stringify(source, null, 2) + "\n",
);
writeFileSync(
  resolve(target, "geometry.css"),
  await format(css, { parser: "css" }),
);
console.log(target);
const rows = Object.entries(source.groups)
  .map(
    ([group, values]) =>
      `<section><h2>${group}</h2><table><tbody>${Object.entries(values)
        .map(
          ([name, value]) =>
            `<tr><td><code>--${name}</code></td><td>${value}</td></tr>`,
        )
        .join("")}</tbody></table></section>`,
  )
  .join("");
writeFileSync(
  resolve(target, "geometry-reference.html"),
  `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Crystra 空间与形状变量</title><link rel="stylesheet" href="component-recipes.css"><style>body{margin:0;padding:32px;font-family:system-ui,sans-serif}main{max-width:1000px;margin:auto}section{margin:20px 0;padding:16px;border:1px solid var(--color-border-default);border-radius:var(--shape-panel);background:var(--color-background-card)}h1{font-size:24px}h2{font-size:16px}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid var(--color-border-default);font-size:14px}p{color:var(--color-text-secondary)}</style><body class="crystra-bi" data-crystra-theme="dark" style="background:var(--color-background-workspace)"><main><h1>空间、形状与动效变量</h1><p>从已接受组件、Task 与观测 v8 提取。包括对比分析列宽、断点、侧栏、编辑器与缩略图安全边距；图表数据坐标和宿主 Input 仍由各自 owner 管理。</p>${rows}</main></body></html>`,
);

writeFileSync(
  resolve(target, "card-surfaces.css"),
  readFileSync(
    new URL("../packages/bi/src/card-surfaces.css", import.meta.url),
    "utf8",
  ),
);
