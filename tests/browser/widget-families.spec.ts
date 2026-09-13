import { test, expect } from "@playwright/test";
test("one widget preserves its data while changing presentation and capacity", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/library.html");
  await page
    .getByRole("button", { name: "Dashboard 与图表", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit dashboard", exact: true })
    .click();
  const state = page.locator('.dashboard-panel[data-panel-id="state"]');
  await state.click({ button: "right" });
  await page.getByRole("menuitemradio", { name: "1×2", exact: true }).click();
  await expect(state).toContainText("验证构建产物");
  const value = page.locator('.dashboard-panel[data-panel-id="value"]');
  await value.click({ button: "right" });
  await page
    .getByRole("menuitemradio", { name: "仪表盘", exact: true })
    .click();
  await expect(value).toHaveAttribute("data-grid-width", "1");
  await expect(value).toContainText("42");
  await value.click({ button: "right" });
  await page.getByRole("menuitemradio", { name: "2×2", exact: true }).click();
  await expect(value).toContainText("42");
  const composition = page.locator(
    '.dashboard-panel[data-panel-id="composition"]',
  );
  await composition.click({ button: "right" });
  await page.getByRole("menuitemradio", { name: "饼图", exact: true }).click();
  await expect(composition).toContainText("72");
  await expect(composition).toContainText("30");
  await expect(composition).toContainText("18");
  const series = page.locator('.dashboard-panel[data-panel-id="period"]');
  await series.click({ button: "right" });
  await page
    .getByRole("menuitemradio", { name: "折线图", exact: true })
    .click();
  await expect(series.locator("polyline")).toHaveCount(1);
  await expect(series.locator('svg[role="img"]')).toHaveAttribute(
    "aria-label",
    /09:00 3 次/,
  );
  await page
    .getByRole("button", { name: "Cancel editing", exact: true })
    .click();
  await expect(state).toHaveAttribute("data-grid-width", "1");
  await expect(value).toHaveAttribute("data-grid-width", "1");
});
test("expanding activity preserves state and changing gauge to number uses the common geometry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/library.html");
  await page
    .getByRole("button", { name: "Dashboard 与图表", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit dashboard", exact: true })
    .click();
  const state = page.locator('.dashboard-panel[data-panel-id="state"]');
  await state.click({ button: "right" });
  await page.getByRole("menuitemradio", { name: "1×2", exact: true }).click();
  await expect(state).toContainText("运行中");
  await expect(state).toContainText("验证构建产物");
  const gauge = page.locator('.dashboard-panel[data-panel-id="gauge"]');
  await gauge.click({ button: "right" });
  await page.getByRole("menuitemradio", { name: "数字", exact: true }).click();
  await expect(gauge).toHaveCSS("width", "160px");
  const gap = async (id: string) =>
    page
      .locator(`.dashboard-panel[data-panel-id="${id}"] .expression-widget`)
      .evaluate((e) => {
        const root = e.getBoundingClientRect(),
          h = e.querySelector("header")!.getBoundingClientRect(),
          c = e
            .querySelector(".crystra-monitoring-widget-content")!
            .getBoundingClientRect();
        return {
          header: h.y - root.y,
          content: c.y - root.y,
          gap: c.y - h.bottom,
        };
      });
  await expect(gauge).toHaveCSS("height", "160px");
  await expect
    .poll(async () => {
      const a = await gap("gauge"),
        b = await gap("value");
      return Math.max(
        ...Object.keys(a).map((k) =>
          Math.abs(a[k as keyof typeof a] - b[k as keyof typeof b]),
        ),
      );
    })
    .toBeLessThan(0.1);
});
test("distribution, coverage matrix and profile alternatives preserve original observations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/library.html");
  await page
    .getByRole("button", { name: "Dashboard 与图表", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit dashboard", exact: true })
    .click();
  for (const [id, view, label, value] of [
    ["distribution", "频数表", "0–50", "2"],
    ["matrix", "数值表", "回归测试", "无数据"],
    ["radar", "分组条形图", "成本效率", "88"],
  ]) {
    const panel = page.locator(`.dashboard-panel[data-panel-id="${id}"]`);
    await panel.click({ button: "right" });
    await page.getByRole("menuitemradio", { name: view, exact: true }).click();
    await expect(panel).toContainText(label);
    await expect(panel).toContainText(value);
  }
});
