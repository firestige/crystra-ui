/** Capture the accepted local design as fixture data; runtime has no dependency on tmp. */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { format } from "prettier";
const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");
const postcss = require("postcss");
const source =
  process.argv[2] ?? "../docs/design/crystra-ui/assets/widget-semantics.html";
const d = new JSDOM(readFileSync(source, "utf8")).window.document as Document;
const fixture = {
  groups: Array.from(d.querySelectorAll<HTMLElement>(".group")).map(
    (group) => ({
      id: group.id,
      description: group.children[0].innerHTML,
      cards: Array.from(group.querySelectorAll<HTMLElement>(".widget")).map(
        (card) => ({
          title: card.querySelector(".title")!.textContent,
          width: Number(card.dataset.width),
          height: Number(card.dataset.height),
          status: card.querySelector("header .marker")?.outerHTML ?? null,
          body: card.querySelector(".content")!.innerHTML,
          footer: card.querySelector("footer > span")!.textContent,
          action: card.querySelector("footer > span:last-child")!.outerHTML,
        }),
      ),
    }),
  ),
};
writeFileSync(
  new URL("../design/widget-monitoring-preview.json", import.meta.url),
  JSON.stringify(fixture, null, 2) + "\n",
);
const css = postcss.parse(d.querySelector("style")!.textContent!);
css.walkRules((rule: { selectors: string[] }) => {
  rule.selectors = rule.selectors.map(
    (selector) =>
      (selector === "body"
        ? ".wsr-monitoring"
        : `.wsr-monitoring ${selector}`) +
      ":not([data-host-owned], [data-host-owned] *)",
  );
});
writeFileSync(
  new URL("../packages/bi/src/monitoring-widget.css", import.meta.url),
  await format(
    css.toString() +
      `
.wsr-monitoring .monitoring-fixture-content:not([data-host-owned], [data-host-owned] *) { display: contents; }
.wsr-monitoring .widget > header > div:not([data-host-owned], [data-host-owned] *) { min-width:0; }`,
    { parser: "css" },
  ),
);
