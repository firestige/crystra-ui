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
