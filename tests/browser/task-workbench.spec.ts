import { test, expect } from "@playwright/test";
test("v8 Task frame keeps one host input while switching five independent benches", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/task-test.html");
  const input = page.getByRole("textbox", { name: "宿主输入替身" });
  await input.fill("保留未发送输入");
  const before = await input.boundingBox();
  const control = await page
    .locator('[data-section-id="control-workspace"]')
    .boundingBox();
  expect(before!.width).toBeGreaterThanOrEqual(360);
  expect(control!.width).toBeGreaterThanOrEqual(680);
  expect(Math.abs(before!.y - control!.y)).toBeLessThan(1);
  await page.getByRole("tab", { name: "计划", exact: true }).click();
  await expect(
    page.getByRole("tabpanel", { name: "计划", exact: true }),
  ).toContainText("目标与完成判定");
  await expect(input).toHaveValue("保留未发送输入");
  expect(await input.boundingBox()).toEqual(before);
  await expect(page.getByRole("textbox")).toHaveCount(1);
  await expect(page.getByLabel("系统当前工作面：执行")).toBeVisible();
});

test("requirement projection keeps the v8 question-map and live-brief columns beside the host input", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/task-test.html");
  await page.getByRole("tab", { name: "需求", exact: true }).click();
  const map = page.locator('[data-section-id="grilling-question-map"]');
  const brief = page.locator('[data-section-id="grilling-live-brief"]');
  await expect(map).toContainText("目标与结果");
  await expect(brief).toContainText("本轮变更");
  const a = await map.boundingBox();
  const b = await brief.boundingBox();
  expect(b!.x).toBeGreaterThan(a!.x + a!.width);
  expect(Math.abs(a!.y - b!.y)).toBeLessThan(1);
  await expect(page.getByRole("textbox", { name: "宿主输入替身" })).toHaveCount(
    1,
  );
});

test("Gate selection and Delivery inspection preserve the unsent host draft", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/task-test.html");
  const input = page.getByRole("textbox", { name: "宿主输入替身" });
  await input.fill("审核选择不表示授权");
  await page.getByText("待决策 3", { exact: true }).click();
  await page
    .getByRole("button", { name: /是否接受发布说明覆盖率低于计划目标/ })
    .click();
  await expect(
    page.locator('[data-section-id="gate-review-overview"]'),
  ).toContainText("Gate G-5");
  await expect(
    page.locator('[data-section-id="gate-execution-preview"]'),
  ).toContainText("尚未授权");
  await page.getByRole("button", { name: /^发布说明差异 / }).click();
  await expect(
    page.locator('[data-section-id="gate-context-inspector"]'),
  ).toContainText("proposal:patch-104");
  await page
    .getByRole("button", { name: "返回当前审核问题", exact: true })
    .click();
  await page.getByRole("tab", { name: "交付", exact: true }).click();
  await expect(
    page.getByRole("tabpanel", { name: "交付", exact: true }),
  ).toContainText("可交付");
  await expect(input).toHaveValue("审核选择不表示授权");
  await page.getByRole("tab", { name: "审核", exact: true }).click();
  await expect(
    page.locator('[data-section-id="gate-review-overview"]'),
  ).toContainText("Gate G-5");
  await expect(input).toHaveCount(1);
});

test("Plan document and DAG navigation and Wave drilldown retain host input", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/task-test.html");
  const input = page.getByRole("textbox", { name: "宿主输入替身" });
  await input.fill("层级切换不启动运行");
  await page.getByRole("tab", { name: "计划", exact: true }).click();
  await page.getByRole("button", { name: "查看完整计划", exact: true }).click();
  await expect(
    page.getByText("修订版 4 · 源提交 abc123 · 设计样本"),
  ).toBeVisible();
  await page.getByRole("button", { name: "返回计划摘要", exact: true }).click();
  await page.getByRole("button", { name: "查看完整 DAG", exact: true }).click();
  await page.getByRole("button", { name: "适应视图", exact: true }).click();
  await page.getByRole("button", { name: "市场规则研究", exact: true }).click();
  await expect(page.getByText("选中计划节点：research")).toBeVisible();
  await page.getByRole("tab", { name: /^执行/ }).click();
  await page
    .getByRole("button", { name: "查看批次 1B 的工作流运行", exact: true })
    .click();
  await expect(
    page.locator('[data-section-id="execution-wave-run-detail"]'),
  ).toContainText("68%");
  await page.getByText("运行身份", { exact: true }).click();
  await expect(
    page.getByText("workflow-v3/run-08", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "返回计划执行", exact: true }).click();
  await expect(page.getByText("计划执行总览", { exact: true })).toBeVisible();
  await expect(input).toHaveValue("层级切换不启动运行");
});

test("v8 compact rail preserves the input and opens navigation without widening the workspace", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/task-test.html");
  const input = page.getByRole("textbox", { name: "宿主输入替身" });
  await input.fill("折叠后保留");
  await page.getByRole("button", { name: "收起侧边栏", exact: true }).click();
  expect(
    (await page.locator('[data-section-id="sidebar"]').boundingBox())!.width,
  ).toBe(64);
  expect(
    (await page.locator("[data-brand-crystra]").boundingBox())!.width,
  ).toBe(24);
  await expect(
    page.getByRole("button", { name: "收起侧边栏", exact: true }),
  ).toBeHidden();
  await page.getByRole("button", { name: "分析", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "调用追踪", exact: true }),
  ).toBeVisible();
  expect(
    (await page.locator('[data-section-id="sidebar"]').boundingBox())!.width,
  ).toBe(64);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "调用追踪", exact: true }),
  ).toBeHidden();
  await page.getByRole("button", { name: "展开侧边栏", exact: true }).click();
  expect(
    (await page.locator('[data-section-id="sidebar"]').boundingBox())!.width,
  ).toBe(260);
  await expect(input).toHaveValue("折叠后保留");
});

test("supplied plan drawing uses the full accepted canvas and supports keyboard node selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/task-test.html");
  await page.getByRole("tab", { name: "计划", exact: true }).click();
  const summary = page.getByRole("img", {
    name: "当前 Task 计划中包含并行分支、汇合、关口和恢复循环的 DAG",
    exact: true,
  });
  await expect(summary).toHaveAttribute("viewBox", "0 0 760 250");
  const bounds = await summary.boundingBox();
  expect(bounds!.width).toBeGreaterThan(300);
  expect(bounds!.height).toBeGreaterThan(100);
  await page.getByRole("button", { name: "查看完整 DAG", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "可缩放和拖动的完整计划 DAG", exact: true }),
  ).toBeVisible();
  const node = page.getByRole("button", {
    name: "构建与签名验证",
    exact: true,
  });
  await node.focus();
  await node.press("Enter");
  await expect(
    page.getByText("选中计划节点：build", { exact: true }),
  ).toBeVisible();
});

test("opening Task detail views exposes the back control inside the scrolled workbench", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/task-test.html");
  const input = page.getByRole("textbox", { name: "宿主输入替身" });
  await input.fill("保留对话滚动与草稿");
  const inputBox = await input.boundingBox();
  await page.getByRole("button", { name: /^签名配置差异 / }).click();
  const panel = page.getByRole("tabpanel", { name: "审核", exact: true });
  const back = page.getByRole("button", {
    name: "返回当前审核问题",
    exact: true,
  });
  expect((await back.boundingBox())!.y).toBeGreaterThanOrEqual(
    (await panel.boundingBox())!.y,
  );
  await expect(input).toHaveValue("保留对话滚动与草稿");
  expect(await input.boundingBox()).toEqual(inputBox);
});
