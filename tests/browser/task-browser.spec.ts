import { test, expect } from "@playwright/test";
test("v8 Task Browser uses fluid gallery cards, one view toggle and explicit unknown metadata", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/task-browser-test.html");
  const cards = page.locator(".browser-task-card");
  await expect(cards.first()).toBeVisible();
  const first = await cards.nth(0).boundingBox(),
    second = await cards.nth(1).boundingBox();
  expect(first!.width).toBeGreaterThanOrEqual(272);
  expect(first!.y).toBe(second!.y);
  expect(second!.x - first!.x - first!.width).toBeCloseTo(16, 0);
  await cards.first().getByRole("checkbox").check();
  await expect(page.getByRole("note")).not.toContainText("已选择");
  await page
    .getByRole("button", { name: "任务视图：Gallery，切换到 List" })
    .click();
  await expect(
    page.getByRole("checkbox", {
      name: "选择任务：校验资源导入结果 · 1",
      exact: true,
    }),
  ).toBeChecked();
  await expect(page.getByText("成本未知", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "下一页", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "打开任务：校验资源导入结果 · 13",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: "搜索任务", exact: true })
    .fill("校验资源导入结果 · 1");
  await expect(
    page.getByRole("checkbox", {
      name: "选择任务：校验资源导入结果 · 1",
      exact: true,
    }),
  ).not.toBeChecked();
  await page
    .getByRole("button", {
      name: "打开任务：校验资源导入结果 · 1",
      exact: true,
    })
    .click();
  await expect(page.getByRole("note")).toContainText("已选择 task-design-1");
});

test("Gallery group folding survives view and query changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/task-browser-test.html");
  const group = page.getByRole("button", {
    name: "Workspace 1 20",
    exact: true,
  });
  await group.click();
  await expect(group).toHaveAttribute("aria-expanded", "false");
  await page
    .getByRole("button", { name: "任务视图：Gallery，切换到 List" })
    .click();
  await page
    .getByRole("button", { name: "任务视图：List，切换到 Gallery" })
    .click();
  await expect(group).toHaveAttribute("aria-expanded", "false");
  await page
    .getByRole("searchbox", { name: "搜索任务", exact: true })
    .fill("校验资源导入结果");
  await expect(group).toHaveAttribute("aria-expanded", "false");
});

test("returning from an exact Task restores the List query and page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/task-browser-test.html");
  await page
    .getByRole("searchbox", { name: "搜索任务", exact: true })
    .fill("校验资源导入结果");
  await page
    .getByRole("button", { name: "任务视图：Gallery，切换到 List" })
    .click();
  await page.getByRole("button", { name: "下一页", exact: true }).click();
  await page
    .getByRole("button", {
      name: "打开任务：校验资源导入结果 · 13",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "返回任务目录", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "任务视图：List，切换到 Gallery" }),
  ).toBeVisible();
  await expect(
    page.getByRole("searchbox", { name: "搜索任务", exact: true }),
  ).toHaveValue("校验资源导入结果");
  await expect(
    page.getByRole("button", {
      name: "打开任务：校验资源导入结果 · 13",
      exact: true,
    }),
  ).toBeVisible();
});

test("sort menu uses keyboard radio navigation and returns focus to its icon trigger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/task-browser-test.html");
  const trigger = page.getByRole("button", {
    name: "排序：最近活动，降序",
    exact: true,
  });
  await trigger.press("ArrowDown");
  await expect(
    page.getByRole("menuitemradio", { name: "最近活动", exact: true }),
  ).toBeFocused();
  await page.getByRole("menu").press("End");
  await expect(
    page.getByRole("menuitemradio", { name: "成本", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("menuitemradio", { name: "成本", exact: true })
    .press("Enter");
  await expect(
    page.getByRole("button", { name: "排序：成本，降序", exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("menu")).toBeHidden();
});
