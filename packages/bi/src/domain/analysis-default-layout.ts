import {
  PRESET_LAYOUTS,
  panelSizeForGrid,
  type DashboardLayout,
} from "./layout/layout";
import type { ObservationSources } from "./analysis-overview";
const dashboardLayout = PRESET_LAYOUTS["default-overview@1"];
export function createAnalysisLayout(
  widgets: ObservationSources,
): DashboardLayout {
  const panels: DashboardLayout["panels"] = [];
  for (const topic of ["resources", "quality"]) {
    let x = 0,
      y = 0,
      rowHeight = 0;
    const entries = Object.entries(widgets).filter(
      ([, item]) => item.topic === topic,
    );
    if (topic === "resources") {
      const order = [
        "spend",
        "equivalent",
        "calls",
        "input",
        "costTrend",
        "callTrend",
        "tokenTrend",
        "cache0",
        "cache1",
        "cache2",
        "subscription",
      ];
      entries.sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
    }
    for (const [id, item] of entries) {
      const [h, w] = item.size.split("x").map(Number);
      // Keep summaries, daily trends, and cache/subscription context on separate rows.
      const startsResourceRow =
        topic === "resources" && ["cache0", "costTrend"].includes(id);
      if (x + w > 9 || (startsResourceRow && x > 0)) {
        y += rowHeight;
        x = 0;
        rowHeight = 0;
      }
      const grid = { x, y, w, h };
      panels.push({
        ...dashboardLayout.panels[0],
        panel_id: id,
        grid,
        size: panelSizeForGrid(grid),
        channels: { source: id },
      });
      x += w;
      rowHeight = Math.max(rowHeight, h);
    }
  }
  return { ...dashboardLayout, name: "系统观测", panels };
}
