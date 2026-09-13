import { test, expect } from "@playwright/test";

test("workflow portals mount after host setup and chat uses the committed view", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/workbench-preview.html", async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    await route.fulfill({
      response,
      body: html.replace(
        "<body>",
        `<body>
      <div data-section-id="workspace-header"><div data-header-slot="context"></div></div>
      <div data-section-id="conversation-feed">Host placeholder</div>
      <div data-host-owned="dsh-input"><textarea aria-label="测试对话"></textarea></div>
      <button data-section-id="composer-send">发送</button>`,
      ),
    });
  });
  await page.goto("/workbench-preview.html");
  await expect(page.locator(".map-chat")).toContainText("工作流对话");
  await expect(page.locator(".map-header-actions")).toBeVisible();
  await expect(page.getByText("Host placeholder", { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("tab", { name: "结晶分析", exact: true }).click();
  await page.getByRole("textbox", { name: "测试对话" }).fill("请分析这条流程");
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(page.locator(".map-chat")).toContainText("已记录这条结晶讨论");
  expect(errors).toEqual([]);
});
