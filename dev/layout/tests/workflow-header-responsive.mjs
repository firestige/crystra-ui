import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
// Optional authenticated production URL; default verifies the local design host.
const url =
  process.env.CRYSTRA_HEADER_URL ||
  "http://127.0.0.1:3086/workflows/hello-world-workflow?view=studio&revision=local%3Asha256%3A996499cae890d93671d247f8102f18d17566d5062b36691299a02f9366e8acf8";
const b = await chromium.launch();
try {
  const p = await b.newPage();
  await p.goto(url);
  await p.locator(".map-header-actions").waitFor();
  for (const width of [1920, 1660, 1640, 1600, 1440, 1280, 1180, 1024]) {
    await p.setViewportSize({ width, height: 820 });
    await p.waitForTimeout(300);
    const measurement = await p.evaluate(() => {
      const sels = [
        '[data-section-id="workspace-header"]',
        '[data-header-slot="identity"]',
        '[data-header-slot="navigation"]',
        '[data-header-slot="context"]',
        ".map-header-actions",
      ];
      return {
        viewport: innerWidth,
        items: sels.map((s) => {
          const e = document.querySelector(s),
            r = e.getBoundingClientRect(),
            c = getComputedStyle(e);
          return {
            s,
            x: r.x,
            y: r.y,
            w: r.width,
            h: r.height,
            clientH: e.clientHeight,
            scrollH: e.scrollHeight,
            clientW: e.clientWidth,
            scrollW: e.scrollWidth,
            gap: c.gap,
            grid: c.gridTemplateColumns,
            rows: c.gridTemplateRows,
            overflow: c.overflow,
            wrap: c.flexWrap,
          };
        }),
      };
    });
    const [header, identity, nav, context, actions] = measurement.items;
    assert(
      context.scrollH <= context.clientH,
      `vertical overflow at ${width}: ${context.scrollH}/${context.clientH}`,
    );
    assert(
      actions.scrollW <= actions.clientW,
      `horizontal overflow at ${width}: ${actions.scrollW}/${actions.clientW}`,
    );
    assert(context.x >= nav.x + nav.w, `overlap at ${width}`);
    assert.equal(header.h, 88);
    console.log(width, "PASS");
  }
  await p.setViewportSize({ width: 1180, height: 820 });
  await p.waitForTimeout(300);
  const toolbar = p.locator(".map-header-actions");
  await toolbar.getByRole("button", { name: "显示", exact: true }).click();
  let menu = p.getByRole("menu", { name: "显示", exact: true });
  await menu.waitFor();
  const r = await menu.boundingBox();
  assert(r.x >= 0 && r.x + r.width <= 1180 && r.y >= 0);
  await menu
    .getByRole("menuitem", { name: "路径 · 全部路径", exact: true })
    .click();
  await toolbar.getByRole("button", { name: "显示", exact: true }).click();
  await p.getByRole("menuitem", { name: "布局 · 纵向", exact: true }).click();
  await p.waitForTimeout(400);
  await toolbar.getByRole("button", { name: "显示", exact: true }).click();
  await p.getByRole("menuitem", { name: "布局 · 横向", exact: true }).click();
  await toolbar.getByRole("button", { name: "显示", exact: true }).click();
  await p
    .getByRole("menuitem", { name: "路径 · 预期路径", exact: true })
    .click();
  await toolbar.getByRole("button", { name: "视图", exact: true }).click();
  await p.getByRole("menuitem", { name: "全图概览", exact: true }).click();
  await p.waitForTimeout(400);
  console.log("PASS menus within viewport, path, direction, overview actions");
} finally {
  await b.close();
}
