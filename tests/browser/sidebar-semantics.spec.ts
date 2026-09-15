import { test, expect } from "@playwright/test";

test("v8 semantic presets and custom tokens remain live after migration", async ({
  page,
}) => {
  await page.goto("/sidebar-v8-test.html");
  const shell = page.locator(".crystra-v8-shell");
  const action = page.locator('[data-section-id="task-view-options-action"]');
  // Expected values are observations of the accepted presets, not component constants.
  for (const [preset, hit, icon] of [
    ["compact", "28px", "14px"],
    ["balanced", "32px", "16px"],
    ["prominent", "36px", "18px"],
    ["dsh", "28px", "14px"],
  ]) {
    await shell.evaluate((el, preset) => {
      (el as HTMLElement).dataset.iconScale = preset;
    }, preset);
    await expect(action).toHaveCSS("width", hit);
    await expect(action).toHaveCSS("height", hit);
    await expect(action.locator("svg")).toHaveCSS("width", icon);
  }
  await shell.evaluate((el) => {
    (el as HTMLElement).style.setProperty("--icon-tool-hit", "40px");
    (el as HTMLElement).style.setProperty("--icon-inline-action-size", "20px");
    (el as HTMLElement).style.setProperty(
      "--color-interaction-hover",
      "rgb(23, 45, 67)",
    );
  });
  await expect(action).toHaveCSS("width", "40px");
  await expect(action.locator("svg")).toHaveCSS("width", "20px");
  const title = page.locator('[data-section-id="task-section-toggle"]');
  await title.hover();
  await expect(
    page.locator('[data-section-id="task-section-header"]'),
  ).toHaveCSS("background-color", "rgb(23, 45, 67)");
  await shell.evaluate((el) => {
    for (const token of [
      "--icon-tool-hit",
      "--icon-inline-action-size",
      "--color-interaction-hover",
    ])
      (el as HTMLElement).style.removeProperty(token);
  });
  await expect(action).toHaveCSS("width", "28px");
  await expect(action.locator("svg")).toHaveCSS("width", "14px");
  await expect(
    page.locator('[data-section-id="task-section-header"]'),
  ).toHaveCSS("background-color", "rgba(255, 255, 255, 0.08)");
});
