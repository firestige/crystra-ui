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
