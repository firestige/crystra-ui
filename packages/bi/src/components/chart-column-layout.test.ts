import { expect, it } from "vitest";
import { chartColumnLayout } from "./chart-column-layout";
it("keeps cards bounded with centered margins larger than gaps", () => {
  for (let width = 528; width <= 3200; width++) {
    const { count, cardWidth, gap, margin } = chartColumnLayout(width);
    expect(cardWidth).toBeGreaterThanOrEqual(480);
    expect(cardWidth).toBeLessThanOrEqual(640);
    expect(margin).toBeGreaterThan(gap);
    expect(count * cardWidth + (count - 1) * gap + 2 * margin).toBeCloseTo(
      width,
      6,
    );
    expect(count).toBeLessThanOrEqual(4);
  }
});
it("uses fixed view-width breakpoints regardless of the number of charts", () => {
  for (const [width, count] of [
    [420, 1],
    [1043, 1],
    [1044, 2],
    [1565, 2],
    [1566, 3],
    [2079, 3],
    [2080, 4],
    [5000, 4],
  ]) {
    expect(chartColumnLayout(width).count).toBe(count);
  }
  expect(chartColumnLayout(420)).toMatchObject({
    count: 1,
    cardWidth: 480,
    margin: 0,
  });
});
