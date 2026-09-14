import { test, expect } from "@playwright/test";
test("Workflow shared Input survives projection changes and the divider obeys v8 keyboard and pointer bounds", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workflow-workbench-test.html");
  const input = page.getByRole("textbox", { name: "隔离 Input 替身" }),
    divider = page.getByRole("separator");
  await input.fill("unsent draft");
  await divider.press("Home");
  await expect(divider).toHaveAttribute("aria-valuenow", "360");
  await divider.press("ArrowRight");
  await expect(divider).toHaveAttribute("aria-valuenow", "376");
  await page.getByRole("tab", { name: "资源配置", exact: true }).click();
  await expect(input).toHaveValue("unsent draft");
  await expect(page.getByRole("tabpanel", { name: "资源配置" })).toBeVisible();
  await expect(divider).toHaveAttribute("aria-valuenow", "376");
  await divider.press("End");
  await expect(divider).toHaveAttribute("aria-valuenow", "640");
  const bounds = await divider.boundingBox();
  await page.mouse.move(bounds!.x, bounds!.y + 20);
  await page.mouse.down();
  await page.mouse.move(300, bounds!.y + 20);
  await page.mouse.up();
  await expect(divider).toHaveAttribute("aria-valuenow", "360");
  await page.setViewportSize({ width: 600, height: 720 });
  await expect(divider).toHaveAttribute("aria-valuemax", "360");
  await expect(input).toHaveValue("unsent draft");
});
