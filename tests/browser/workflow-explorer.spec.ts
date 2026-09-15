import { test, expect } from "@playwright/test";
test("Workflow Explorer preserves exact revisions, selection and shared v8 Gallery/List geometry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/workflow-explorer-test.html");
  const cards = page.locator(".browser-task-card");
  await expect(cards.first()).toBeVisible();
  const first = await cards.nth(0).boundingBox(),
    second = await cards.nth(1).boundingBox();
  expect(first!.width).toBeGreaterThanOrEqual(272);
  expect(first!.y).toBe(second!.y);
  expect(second!.x - first!.x - first!.width).toBeCloseTo(16, 0);
  await expect(page.getByRole("status")).toContainText("48 项工作流");
  await page.getByRole("button", { name: "已确认", exact: true }).click();
  await expect(page.getByText("没有符合条件的工作流")).toBeVisible();
  await page.getByRole("button", { name: "全部版本", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("96 个版本");
  await page
    .getByRole("checkbox", {
      name: "选择工作流：导入校验工作流 1，r1",
      exact: true,
    })
    .check();
  await page
    .getByRole("button", {
      name: "工作流视图：Gallery，切换到 List",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("checkbox", {
      name: "选择工作流：导入校验工作流 1，r1",
      exact: true,
    }),
  ).toBeChecked();
  await page
    .getByRole("button", {
      name: "打开工作流：导入校验工作流 1，r1",
      exact: true,
    })
    .click();
  await expect(page.getByRole("note")).toContainText("workflow-design-1@r1");
  await page.getByRole("button", { name: "最新版本", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "全选结果", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "全部", exact: true }).click();
  await expect(page.getByRole("status")).not.toContainText("已选择");
  await page.getByRole("button", { name: "下一页", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "打开工作流：导入校验工作流 13，r3",
      exact: true,
    }),
  ).toBeVisible();
});
test("Workflow Explorer restores all-version list and page after leaving its mount", async ({
  page,
}) => {
  await page.goto("/workflow-explorer-test.html");
  await page.getByRole("button", { name: "全部版本", exact: true }).click();
  await page
    .getByRole("button", {
      name: "工作流视图：Gallery，切换到 List",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "下一页", exact: true }).click();
  const target = page.getByRole("button", {
    name: "打开工作流：导入校验工作流 5，r1",
    exact: true,
  });
  await target.click();
  await page
    .getByRole("button", { name: "模拟返回工作流目录", exact: true })
    .click();
  await expect(target).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "工作流视图：List，切换到 Gallery",
      exact: true,
    }),
  ).toBeVisible();
});
