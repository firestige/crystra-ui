import { expect, test } from "@playwright/test";
test("Crystra recipes compose dimensions and colors and keep pointer/focus states stable", async ({
  page,
}) => {
  await page.goto("/components.html");
  const copy = page.getByRole("button", { name: "复制", exact: true });
  for (const appearance of ["outline", "solid", "ghost"])
    for (const tone of ["neutral", "primary", "success", "warning", "danger"])
      for (const size of ["compact", "regular"]) {
        await page.getByLabel("外观", { exact: true }).selectOption(appearance);
        await page.getByLabel("语义色", { exact: true }).selectOption(tone);
        await page.getByLabel("尺寸", { exact: true }).selectOption(size);
        await expect(copy).toHaveAttribute("data-appearance", appearance);
        await expect(copy).toHaveAttribute("data-tone", tone);
        const box = await copy.boundingBox();
        expect(box?.width).toBe(size === "compact" ? 28 : 36);
        expect(box?.height).toBe(size === "compact" ? 28 : 36);
        const color = await copy.evaluate((e) => getComputedStyle(e).color);
        expect(color).not.toBe("rgba(0, 0, 0, 0)");
      }
  await copy.click();
  await expect(page.getByText("已点击 1 次")).toBeVisible();
  await page.getByLabel("禁用", { exact: true }).check();
  await expect(copy).toBeDisabled();
  await page.getByLabel("禁用", { exact: true }).uncheck();
  const before = await copy.boundingBox();
  await copy.hover();
  expect(await copy.boundingBox()).toEqual(before);
  await page.keyboard.press("Tab");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(copy).toHaveCSS("transition-duration", "0s");
  await expect(
    page.locator('.crystra-chip[data-tone="success"]').first(),
  ).toHaveCSS("color", "rgb(34, 197, 94)");
});

test("collection recipes preserve independent actions and keep menus within the viewport", async ({
  page,
}) => {
  await page.goto("/components.html");
  const row = page.getByRole("button", { name: /发布插件市场方案 验证/ });
  const trigger = page.getByRole("button", {
    name: "发布插件市场方案操作",
    exact: true,
  });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.hover();
  const background = await row.evaluate(
    (e) => getComputedStyle(e).backgroundColor,
  );
  await trigger.click();
  await expect(page.getByRole("menu")).toBeVisible();
  expect(await row.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(
    background,
  );
  const box = await page.getByRole("menu").boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
  await page.getByRole("menuitem", { name: "复制标识（演示）" }).click();
  await expect(
    page.getByText("复制标识：release", { exact: true }),
  ).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByRole("tab", { name: "审核 1" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("等待用户决定");
  await page.getByLabel("Tabs 外观", { exact: true }).selectOption("underline");
  await expect(page.getByRole("tab", { name: "审核 1" })).toHaveCSS(
    "border-bottom-width",
    "2px",
  );
  await page.getByLabel("尺寸", { exact: true }).selectOption("regular");
  await expect(page.getByRole("tab", { name: "审核 1" })).toHaveCSS(
    "min-height",
    "36px",
  );
});

test("state samples filter locally, expand within the bench, and show explicit progress", async ({
  page,
}) => {
  await page.goto("/components.html");
  const searchSample = page.locator(".crystra-card").filter({
    has: page.getByRole("heading", { name: "搜索、筛选与选择", exact: true }),
  });
  await searchSample
    .getByRole("searchbox", { name: "搜索条目", exact: true })
    .fill("不存在");
  await expect(page.getByText("没有匹配的条目", { exact: true })).toBeVisible();
  await searchSample
    .getByRole("searchbox", { name: "搜索条目", exact: true })
    .fill("");
  const bench = page.locator(".preview-bench");
  const before = await bench.boundingBox();
  await page.getByRole("button", { name: "展开条目列表" }).click();
  const viewer = page.locator(".crystra-bench-viewer");
  const box = await viewer.boundingBox();
  expect(box!.height).toBeLessThanOrEqual(before!.height);
  const scroll = page.locator(".crystra-viewer-scroll");
  expect(await scroll.evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(
    true,
  );
  await scroll.evaluate((e) => {
    e.scrollTop = e.scrollHeight;
  });
  await expect(page.getByText("示例条目 18", { exact: true })).toBeInViewport();
  await page.getByRole("button", { name: "返回条目列表" }).click();
  await expect(
    page.getByRole("button", { name: "展开条目列表" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "筛选条件", exact: true }).click();
  await page.getByLabel("仅显示首项（演示）").check();
  await page.keyboard.press("Escape");
  await expect(page.getByText("共 1 项，预览最多 3 项")).toBeVisible();
  await page.getByRole("button", { name: "显示通知" }).click();
  await page.getByRole("button", { name: "推进 25%" }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "25",
  );
  const notice = await page.locator(".crystra-progress-notice").boundingBox();
  expect(notice!.y + notice!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height,
  );
  await page.getByRole("button", { name: "关闭通知" }).click();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
});
