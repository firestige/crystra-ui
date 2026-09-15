import { test, expect } from "@playwright/test";
test("complete v8 composition retains layout editing across pages and exposes trace directory", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/analysis-test.html");
  await expect(page.getByRole("note", { name: "数据来源" })).toContainText(
    "设计样本",
  );
  await expect(
    page.getByRole("heading", { name: "资源消耗", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "编辑布局", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "取消编辑", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "调用追踪", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Recorded trace waterfall", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "展开调用目录", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "调用记录目录" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "树图", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Recorded trace tree", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "总览", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "取消编辑", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "取消编辑", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "编辑布局", exact: true }),
  ).toBeVisible();
});
