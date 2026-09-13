import { expect, it } from "vitest";
import { analysisFacts, analyzeFacts } from "./result-analysis-fixture";
const operations = { cost: "sum", cache: "ratio", calls: "count", ttft: "p95" };
it("groups actual selected facts and calculates token-weighted ratios", () => {
  const rows = analyzeFacts(
    ["delivery-0001"],
    ["role"],
    ["cache", "calls", "cost"],
    operations,
  );
  expect(rows).toHaveLength(2);
  const source = analysisFacts.filter(
    (row) => row.delivery === "delivery-0001" && row.role === "Engineer",
  );
  expect(rows[0].values.cache).toBeCloseTo(
    (100 * source.reduce((a, b) => a + b.cached, 0)) /
      source.reduce((a, b) => a + b.input, 0),
  );
  expect(rows.reduce((a, b) => a + b.values.calls, 0)).toBe(12);
  const mean = analyzeFacts(["delivery-0001"], ["role"], ["cost"], {
    ...operations,
    cost: "mean",
  });
  expect(mean[0].values.cost).toBeCloseTo(rows[0].values.cost / rows[0].count);
  expect(analyzeFacts([], ["role"], ["calls"], operations)).toEqual([]);
});

it("keeps repeated metric operations independent and counts Delivery separately", async () => {
  const { analyzeItems } = await import("./result-analysis-fixture");
  const result = analyzeItems(
    ["delivery-0001", "delivery-0002"],
    ["role"],
    [
      { id: "p50", metric: "ttft", operation: "p50", name: "P50" },
      { id: "p95", metric: "ttft", operation: "p95", name: "P95" },
    ],
  );
  expect(result[0].deliveryCount).toBe(2);
  expect(result[0].count).toBe(12);
  expect(result[0].values.p50).toBeLessThan(result[0].values.p95);
});
