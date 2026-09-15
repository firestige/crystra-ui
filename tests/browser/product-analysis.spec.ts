import { expect, test } from "@playwright/test";
test("production Analysis composition keeps the closed-directory trace at full width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/product-test.html");
  const waterfall = page.getByRole("region", {
    name: "Recorded trace waterfall",
    exact: true,
  });
  await expect(waterfall).toBeVisible();
  const box = await waterfall.boundingBox();
  expect(box!.width).toBeGreaterThan(800);
  await expect(
    page.getByRole("button", { name: "Statistics", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Tree", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Recorded trace tree", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "总览", exact: true }).click();
  await expect(page.getByText("Overview fixture")).toBeVisible();
  await page.getByRole("tab", { name: "对比分析", exact: true }).click();
  await expect(page.getByText("Reports fixture")).toBeVisible();
  await page.getByRole("tab", { name: "调用追踪", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Recorded trace tree", exact: true }),
  ).toBeVisible();
});

test("product sidebar matches v8 compact geometry and inline section search", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/product-test.html");
  const sidebar = page.getByRole("complementary", { name: "Crystra 导航" });
  expect((await sidebar.boundingBox())!.width).toBe(220);
  const brand = sidebar.locator('[data-section-id="surface-banner"]');
  const mark = sidebar.locator("[data-brand-crystra]");
  expect((await mark.boundingBox())!.x).toBe((await brand.boundingBox())!.x);
  const brandName = sidebar.locator('[data-section-id="sidebar-brand-name"]');
  const brandSize = await brandName.evaluate((el) =>
    getComputedStyle(el).getPropertyValue("--type-brand-size").trim(),
  );
  expect(brandSize).not.toBe("");
  await expect(brandName).toHaveCSS("font-size", brandSize);
  const title = await sidebar
    .locator('[data-section-id="task-section-toggle"]')
    .boundingBox();
  const search = await sidebar
    .getByRole("button", { name: "搜索任务", exact: true })
    .boundingBox();
  expect(
    Math.abs(title!.y + title!.height / 2 - search!.y - search!.height / 2),
  ).toBeLessThan(4);
  await expect(
    sidebar.getByRole("link", { name: "调用追踪", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});
