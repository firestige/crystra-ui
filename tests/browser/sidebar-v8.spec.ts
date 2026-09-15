import { test, expect } from "@playwright/test";
test("Sidebar rows, disclosure motion, full-width search and view controls match v8", async ({
  page,
}) => {
  await page.goto("/product-test.html");
  for (const [kind, label] of [
    ["task", "任务"],
    ["workflow", "工作流"],
  ] as const) {
    const header = page.locator(`[data-section-id="${kind}-section-header"]`);
    const title = header.getByRole("button", { name: label, exact: true });
    await title.hover();
    await expect
      .poll(() => header.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe("rgba(0, 0, 0, 0)");
    const arrow = title.locator("svg");
    await title.click();
    await expect(title).toHaveAttribute("aria-expanded", "false");
    await expect(arrow).toHaveCSS("transform", "matrix(0, -1, 1, 0, 0, 0)");
    expect(
      await arrow.evaluate((el) => getComputedStyle(el).transitionDuration),
    ).not.toBe("0s");
    await header.getByRole("button", { name: "搜索" + label }).click();
    await expect(header.locator(".crystra-sidebar-title")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(
      header.getByRole("button", { name: "全部" + label }),
    ).toHaveCount(0);
    const input = header.getByRole("searchbox");
    await expect(input).toBeFocused();
    const root = await header.boundingBox(),
      search = await header.locator(".crystra-expandable-search").boundingBox();
    expect(search!.width).toBeCloseTo(root!.width, 0);
    await input.press("Escape");
    await header.getByRole("button", { name: label + "视图" }).click();
    await expect(header.getByRole("menu")).toBeVisible();
    await page
      .locator("main")
      .first()
      .click({ position: { x: 400, y: 20 } });
    await expect(header.getByRole("menu")).toHaveCount(0);
    await expect(
      header.locator('[data-iconify="tabler:player-play-filled"]'),
    ).toBeVisible();
  }
  for (const id of ["analysis-section-header", "host-settings"]) {
    const button = page.locator(`[data-section-id="${id}"]`);
    await button.hover();
    await expect
      .poll(() => button.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe("rgba(0, 0, 0, 0)");
    const width = await button.evaluate(
      (el) => el.getBoundingClientRect().width,
    );
    expect(width).toBeGreaterThan(180);
  }
});
