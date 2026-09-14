import { test, expect } from "@playwright/test";
test("crystallization preserves native input draft and separates predictions from measured results", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/workflow-map-viewer-test.html");
  await page
    .getByRole("textbox", { name: "隔离 Input 替身" })
    .fill("keep draft");
  await page.getByRole("tab", { name: "结晶分析", exact: true }).click();
  await expect(page.getByRole("img", { name: "变更后活动图" })).toBeVisible();
  await expect(page.locator(".crystal-flow > path").first()).not.toHaveCSS(
    "stroke",
    "none",
  );
  await expect(page.getByRole("region", { name: "收益预测" })).toContainText(
    "非实测结果",
  );
  await expect(page.getByRole("region", { name: "实测对比" })).toContainText(
    "候选版本尚无运行数据",
  );
  await expect(
    page.getByRole("button", { name: "应用到草稿", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "检查方案", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "方案检查" })).toBeVisible();
  await page.getByRole("button", { name: "关闭方案检查" }).click();
  await page.getByRole("tab", { name: "流程设计", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "隔离 Input 替身" }),
  ).toHaveValue("keep draft");
  expect(errors).toEqual([]);
});
