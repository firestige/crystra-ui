import { chromium } from "playwright-core";
import assert from "node:assert/strict";
const origin = process.env.CRYSTRA_DEV_ORIGIN ?? "http://127.0.0.1:3086";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    origin + "/workflows/design-review?revision=v8&from_task_id=review",
  );
  const tools = [
    "返回焦点",
    "适应当前层",
    "全图概览",
    "折叠全部",
    "展开全部",
    "打开设计验证台",
    "保存草稿",
    "发布版本",
  ];
  for (const name of tools)
    await page.getByRole("button", { name, exact: true }).waitFor();
  assert(await page.evaluate(() => !!window.crystraWorkflowMapCandidate));
  assert(
    (await page.evaluate(() => window.crystraResourceWorkspaces?.length)) > 0,
  );
  await page
    .getByRole("button", { name: "展开 理解与设计", exact: true })
    .click();
  await page.getByRole("button", { name: "返回上层", exact: true }).click();
  await page
    .getByRole("button", { name: "打开设计验证台", exact: true })
    .click();
  await page.getByRole("dialog", { name: "设计验证台", exact: true }).waitFor();
  await page.getByRole("button", { name: "关闭验证台", exact: true }).click();
  await page.getByRole("button", { name: "发布版本", exact: true }).click();
  await page.getByRole("dialog", { name: "发布检查", exact: true }).waitFor();
  await page.getByRole("button", { name: "关闭发布检查", exact: true }).click();
  const input = page.getByRole("textbox", { name: "工作流对话草稿" });
  await input.fill("保留这份未发送草稿");
  const headerHeight = (
    await page.locator('[data-section-id="workspace-header"]').boundingBox()
  ).height;
  await page.getByRole("tab", { name: "资源配置", exact: true }).click();
  await page.getByRole("tab", { name: "内容", exact: true }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get("revision"), "v8");
  assert.equal(new URL(page.url()).searchParams.get("from_task_id"), "review");
  assert.equal(await input.inputValue(), "保留这份未发送草稿");
  assert(
    (await page.locator(".v8-assembly-resources h1").count()) > 0,
    "DSH Markdown renderer must be active",
  );
  await page.getByRole("button", { name: "开启编辑", exact: true }).click();
  await page
    .locator(".cm-content[contenteditable=true]")
    .fill("# Saved preview resource");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page
    .getByText("已保存到页面样本 · 未写入磁盘", { exact: true })
    .waitFor();
  await page.getByRole("tab", { name: "关联图", exact: true }).click();
  await page.locator("[data-graph-node]").first().waitFor();
  await page.getByRole("tab", { name: "结晶分析", exact: true }).click();
  await page.getByRole("button", { name: "检查方案", exact: true }).click();
  await page.getByRole("dialog", { name: "方案检查", exact: true }).waitFor();
  await page.getByRole("button", { name: "关闭方案检查", exact: true }).click();
  await page.getByRole("tab", { name: "资源配置", exact: true }).click();
  assert.equal(
    await page
      .getByRole("tab", { name: "关联图", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  assert.equal(
    (await page.locator('[data-section-id="workspace-header"]').boundingBox())
      .height,
    headerHeight,
  );
  assert.equal(await input.inputValue(), "保留这份未发送草稿");
  assert.deepEqual(errors, []);
  console.log(
    "PASS v8 tools, original assets, dialogs, Markdown, relation graph, route context, retained resource tab and Chat draft",
  );
} finally {
  await browser.close();
}
