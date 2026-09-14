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
  ).toContainText("计划投影");
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
