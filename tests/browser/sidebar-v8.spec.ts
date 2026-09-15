import { test, expect } from "@playwright/test";

test("header actions are centered and own their hover without a second header highlight", async ({
  page,
}) => {
  await page.goto("/sidebar-v8-test.html");
  const analysis = page.locator('[data-section-id="analysis-section-toggle"]');
  await analysis.hover();
  await expect(analysis).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(
    page.locator('[data-section-id="analysis-section-header"]'),
  ).toHaveCSS("background-color", "rgba(255, 255, 255, 0.08)");
  for (const kind of ["task", "workflow"]) {
    const header = page.locator(`[data-section-id="${kind}-section-header"]`);
    const title = page.locator(`[data-section-id="${kind}-section-toggle"]`);
    await title.hover();
    await expect(header).toHaveCSS(
      "background-color",
      "rgba(255, 255, 255, 0.08)",
    );
    const search = page.locator(`[data-section-id="${kind}-search-action"]`);
    await expect(search).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    for (const id of [
      `${kind}-search-action`,
      `${kind}-view-options-action`,
      `all-${kind === "task" ? "tasks" : "workflows"}-action`,
    ]) {
      const action = page.locator(`[data-section-id="${id}"]`);
      await action.hover();
      await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      const offset = await action.evaluate((el) => {
        const r = el.getBoundingClientRect(),
          s = el.querySelector("svg")!.getBoundingClientRect();
        return {
          x: s.x + s.width / 2 - r.x - r.width / 2,
          y: s.y + s.height / 2 - r.y - r.height / 2,
        };
      });
      expect(offset).toEqual({ x: 0, y: 0 });
    }
    await search.click();
    await expect(header.getByRole("searchbox")).toBeFocused();
    await expect(
      page.locator(`[data-section-id="${kind}-section-actions"]`),
    ).toBeHidden();
    await header.getByRole("searchbox").press("Escape");
    await expect(
      page.locator(`[data-section-id="${kind}-section-actions"]`),
    ).toBeVisible();
  }
});

test("closed search shares its sibling actions' hover recipe", async ({
  page,
}) => {
  await page.goto("/sidebar-v8-test.html");
  for (const kind of ["task", "workflow"]) {
    const view = page.locator(
      `[data-section-id="${kind}-view-options-action"]`,
    );
    await view.hover();
    await expect(view).toHaveCSS(
      "background-color",
      "rgba(255, 255, 255, 0.08)",
    );
    const recipe = await view.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        background: s.backgroundColor,
        color: s.color,
        radius: s.borderRadius,
      };
    });
    const search = page.locator(`[data-section-id="${kind}-search-action"]`);
    await search.hover();
    await expect(search).toHaveCSS("background-color", recipe.background);
    await expect(search).toHaveCSS("color", recipe.color);
    await expect(search).toHaveCSS("border-radius", recipe.radius);
    await expect(
      page.locator(`[data-section-id="${kind}-section-header"]`),
    ).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await search.click();
    await expect(
      page
        .locator(`[data-section-id="${kind}-search-control"]`)
        .getByRole("searchbox"),
    ).toBeFocused();
    await expect(search).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  }
});
