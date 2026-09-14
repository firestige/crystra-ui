import { test, expect } from "@playwright/test";
test("resource viewer preserves content/relations navigation with explicit read-only resources", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/workflow-map-viewer-test.html");
  await page.getByRole("tab", { name: "资源配置", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "重命名资源", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "保存", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "在对话中讨论此文件", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "脚本／工具", exact: true }).click();
  await page
    .getByRole("button", { name: "打开文件 cli/README.md", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "开启编辑", exact: true }),
  ).toBeDisabled();
  await page.getByRole("tab", { name: "关联图", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "关联图", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  const references = page.getByRole("button", {
    name: "参考资料",
    exact: true,
  });
  if ((await references.getAttribute("aria-expanded")) !== "true")
    await references.click();
  await page
    .getByRole("button", { name: "打开文件 README.md", exact: true })
    .click();
  await expect(
    page.getByRole("tab", { name: "关联图", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "流程设计", exact: true }).click();
  await page.getByRole("tab", { name: "资源配置", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "关联图", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  expect(errors).toEqual([]);
});

test("resource Header keeps navigation separate from its scrollable action group on a narrow display", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workflow-map-viewer-test.html");
  await page.getByRole("tab", { name: "资源配置", exact: true }).click();
  const header = page.locator('[data-section-id="resource-detail-header"]');
  const navigation = await header
      .locator('[data-header-slot="navigation"]')
      .boundingBox(),
    actions = await header
      .locator('[data-header-slot="context"]')
      .boundingBox();
  expect(actions!.x).toBeGreaterThanOrEqual(navigation!.x + navigation!.width);
});
