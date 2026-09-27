import process from "node:process";
import console from "node:console";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const url = process.env.CRYSTRA_BROWSER_URL || "http://127.0.0.1:3086/tasks";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(url);
  const entry = p.locator('[data-section-id="all-workflows-action"]');
  await entry.waitFor();
  await entry.click();
  const surface = p.locator('[data-section-id="workflow-browser"]');
  await surface.waitFor();
  await surface.locator(".crystra-resource-card").first().waitFor();
  const count = await surface.locator(".crystra-resource-card").count();
  const item = surface.locator(".crystra-resource-card").first();
  const more = item.locator(".browser-item-actions");
  await more.hover();
  await p.waitForTimeout(250);
  const geometry = await item.evaluate((card) => {
    const button = card.querySelector(".browser-item-actions"),
      r = button.getBoundingClientRect(),
      s = card
        .querySelector(".crystra-resource-status")
        .getBoundingClientRect(),
      p = card
        .querySelector(".crystra-resource-copy p")
        .getBoundingClientRect();
    return {
      subtitleHeight: p.height,
      rowHeight: card
        .querySelector(".crystra-resource-footer")
        .getBoundingClientRect().height,
      buttonHeight: r.height,
      gap: r.top - s.bottom,
      center: Math.abs(r.top + r.height / 2 - p.top - p.height / 2),
      border: button.ownerDocument.defaultView.getComputedStyle(button).borderColor,
    };
  });
  assert.equal(geometry.subtitleHeight, 20);
  assert.equal(geometry.rowHeight, geometry.buttonHeight);
  assert(geometry.gap >= 4);
  assert(geometry.center <= 1);
  assert.equal(geometry.border, "rgba(0, 0, 0, 0)");

  assert(count >= 3);
  assert.equal(
    await surface
      .locator('[data-section-id="workspace-header"]')
      .evaluate((e) => e.getBoundingClientRect().height),
    88,
  );
  await surface.getByRole("searchbox", { name: "搜索工作流" }).fill("Hello");
  assert.equal(await surface.locator(".crystra-resource-card").count(), 1);
  await surface
    .getByRole("searchbox", { name: "搜索工作流" })
    .fill("no-such-workflow");
  await surface.getByText("没有符合条件的工作流", { exact: true }).waitFor();
  await surface.getByRole("searchbox", { name: "搜索工作流" }).fill("");
  await surface.getByRole("button", { name: "已确认", exact: true }).click();
  assert.equal(await surface.locator(".crystra-resource-card").count(), 1);
  await surface.getByRole("button", { name: "全部", exact: true }).click();
  await surface.getByRole("button", { name: /Gallery.*List/ }).click();
  assert.equal(await surface.locator(".crystra-resource-row").count(), count);
  const hello = surface.getByRole("button", { name: /工作流操作：Hello/ });
  await hello.click();
  await p.getByRole("menuitem", { name: "资源配置", exact: true }).click();
  await p.waitForURL(/view=resources/);
  assert(p.url().includes("revision=local%3Asha256%3A"));
  await p.locator(".wrb").waitFor();
  await entry.click();
  await surface.waitFor();
  await p.setViewportSize({ width: 1180, height: 820 });
  await p.waitForTimeout(500);
  assert.equal(
    await surface
      .locator('[data-section-id="workspace-header"]')
      .evaluate((e) => e.getBoundingClientRect().height),
    88,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS sidebar → workflow browser, actual local rows, search/filter, shared gallery/list, exact-revision resource navigation, 88px header, no page errors",
  );
} finally {
  await b.close();
}
