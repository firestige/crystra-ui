import assert from "node:assert/strict";
import console from "node:console";
import { chromium } from "@playwright/test";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3086/analysis?view=dashboard");
  await page
    .locator('[data-section-id="observation-dashboard"]')
    .waitFor({ timeout: 6000 });
  assert.equal(
    await page
      .locator('[data-section-id="workspace-header"]')
      .evaluate((e) => e.getBoundingClientRect().height),
    88,
  );
  await page.getByRole("button", { name: "编辑布局", exact: true }).click();
  await page.getByRole("button", { name: "添加 Widget", exact: true }).click();
  await page
    .getByRole("dialog", { name: "添加 Widget", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "关闭添加窗口", exact: true }).click();
  await page.getByRole("button", { name: "取消编辑", exact: true }).click();
  await page.getByRole("tab", { name: "调用追踪", exact: true }).click();
  await page.waitForURL(/view=traces/);
  await page.getByRole("button", { name: "展开调用目录", exact: true }).click();
  await page.locator("#trace-run-directory").waitFor();
  await page
    .locator('#trace-run-directory [data-delivery-id="delivery-0001"] button')
    .click();
  await page.getByTestId("trace-waterfall").waitFor();
  await page.getByRole("button", { name: "树图", exact: true }).click();
  await page.getByTestId("trace-tree").waitFor();
  await page.screenshot({ path: "/private/tmp/analysis-trace-selected.png" });
  await page.getByRole("tab", { name: "对比分析", exact: true }).click();
  await page.waitForURL(/view=reports/);
  await page.locator('[data-section-id="comparison-analysis"]').waitFor();
  await page
    .getByRole("button", { name: "编辑设置 版本变更观察", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "编辑观察设置", exact: true })
    .waitFor();
  await page.screenshot({ path: "/private/tmp/analysis-report-editor.png" });
  await page
    .getByRole("button", { name: "关闭设置编辑器", exact: true })
    .click();
  await page
    .getByRole("button", { name: "编辑设置 版本变更观察", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "设置名称", exact: true })
    .fill("校准观察");
  await page.getByRole("button", { name: "保存设置", exact: true }).click();
  await page
    .getByRole("button", { name: "编辑设置 校准观察", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "设置名称", exact: true })
    .fill("不应保存");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "编辑设置 校准观察", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("textbox", { name: "设置名称", exact: true })
      .inputValue(),
    "校准观察",
  );
  await page
    .getByRole("button", { name: "关闭设置编辑器", exact: true })
    .click();
  await page.goBack();
  await page.getByRole("tab", { name: "调用追踪", exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("tab", { name: "调用追踪", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  await page.setViewportSize({ width: 1180, height: 820 });
  for (const name of ["总览", "调用追踪", "对比分析"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    const geometry = await page.locator(".obs-header").evaluate((e) => ({
      h: e.getBoundingClientRect().height,
      scroll: e.scrollWidth,
      width: e.clientWidth,
    }));
    assert.equal(geometry.h, 88);
    assert(geometry.scroll <= geometry.width, JSON.stringify(geometry));
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS analysis dashboard, trace directory, reports, route/back synchronization, fixed header, no page errors",
  );
} finally {
  await browser.close();
}
