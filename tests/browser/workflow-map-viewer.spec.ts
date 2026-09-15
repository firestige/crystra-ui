import { test, expect } from "@playwright/test";
test("host-neutral map reuses v8 geometry and never replaces Input or exposes sample publication", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/workflow-map-viewer-test.html");
  await expect(
    page.getByRole("group", { name: "工作流活动图", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("原生内容保留检查", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "保存草稿", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "发布版本", exact: true }),
  ).toBeDisabled();
  expect(
    (await page.locator(".crystra-workflow-workbench").boundingBox())!.height,
  ).toBe(1080);
  await expect(page.locator(".map-outline-rail")).toHaveAttribute("inert", "");
  await page.getByRole("button", { name: "显示活动大纲", exact: true }).click();
  await expect(page.locator(".map-outline-rail")).not.toHaveAttribute(
    "inert",
    "",
  );
  await page.getByRole("button", { name: "隐藏活动大纲", exact: true }).click();
  const input = page.getByRole("textbox", { name: "隔离 Input 替身" });
  await input.fill("unsent");
  await input.press("Enter");
  await expect(input).toHaveValue("unsent\n");
  await page
    .getByRole("button", { name: "展开 理解与设计", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "工作流活动图", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "资源配置", exact: true }).click();
  await page.getByRole("tab", { name: "流程设计", exact: true }).click();
  await expect(input).toHaveValue("unsent\n");
  await expect(
    page.getByText("原生内容保留检查", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
