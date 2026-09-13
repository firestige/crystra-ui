import {
  applyChartRange,
  defaultChartRange,
  validateChartRange,
  type ChartRange,
} from "../domain/chart-range";
import {
  panelSizeForGrid,
  type DashboardLayout,
  type LayoutPanel,
} from "../domain/layout/layout";
import {
  queryBinding,
  queryFromBinding,
  type ObservationQuery,
  type ObservationQueryCatalog,
} from "../domain/observation-query";
import type { MonitoringWidgetSize } from "../domain/widget-catalog";
import {
  isWidgetSizeAllowed,
  type View,
  type WidgetData,
} from "../domain/widget-families";
import { dashboardLayout } from "../test-harness/dashboard-fixture";
export type ObservationSources = Record<
  string,
  {
    topic?: "resources" | "quality";
    data: WidgetData;
    view: View;
    size: MonitoringWidgetSize;
    empty?: boolean;
  }
>;
export function resolveObservationSource(
  source: string,
  sources: ObservationSources,
  queries?: ObservationQueryCatalog,
) {
  const query = queryFromBinding(source);
  if (query) {
    if (!queries) throw new Error("当前页面没有指标查询服务");
    return queries.resolve(query);
  }
  if (!Object.hasOwn(sources, source)) throw new Error("未知数据源");
  return sources[source];
}
export function resolveObservationWidget(
  panel: LayoutPanel,
  sources: ObservationSources,
  queries?: ObservationQueryCatalog,
) {
  const source = resolveObservationSource(
    panel.channels.source ?? panel.panel_id,
    sources,
    queries,
  );
  const view = (panel.channels.expressionView ?? source.view) as View;
  const range = panel.channels.range
    ? (JSON.parse(panel.channels.range) as ChartRange)
    : defaultChartRange(view);
  return {
    ...source,
    data: {
      ...applyChartRange(source.data, view, range),
      title: panel.channels.title ?? source.data.title,
    },
    view,
  };
}
export function encodeObservationLayout(
  layout: DashboardLayout,
  sources: ObservationSources,
  queries?: ObservationQueryCatalog,
) {
  return JSON.stringify(
    {
      format: "crystra-observation-layout",
      version: 2,
      name: layout.name,
      widgets: layout.panels.map((p) => ({
        id: p.panel_id,
        ...(queryFromBinding(p.channels.source ?? p.panel_id)
          ? { query: queryFromBinding(p.channels.source ?? p.panel_id) }
          : { source: p.channels.source ?? p.panel_id }),
        title: resolveObservationWidget(p, sources, queries).data.title,
        view: resolveObservationWidget(p, sources, queries).view,
        grid: p.grid,
        ...(p.channels.range ? { range: JSON.parse(p.channels.range) } : {}),
      })),
    },
    null,
    2,
  );
}
export function decodeObservationLayout(
  text: string,
  sources: ObservationSources,
  queries?: ObservationQueryCatalog,
): DashboardLayout {
  const file = JSON.parse(text);
  if (
    file?.format !== "crystra-observation-layout" ||
    ![1, 2].includes(file.version) ||
    typeof file.name !== "string" ||
    !file.name.trim() ||
    !Array.isArray(file.widgets)
  )
    throw new Error("布局文件格式不匹配");
  const ids = new Set<string>();
  const panels = file.widgets.map(
    (item: {
      id: string;
      source: string;
      query?: ObservationQuery;
      range?: ChartRange;
      title: string;
      view: View;
      grid: LayoutPanel["grid"];
    }) => {
      if (
        !item ||
        typeof item.id !== "string" ||
        !item.id ||
        ids.has(item.id) ||
        (!item.query && typeof item.source !== "string") ||
        typeof item.title !== "string" ||
        !item.title.trim()
      )
        throw new Error("Widget 身份、数据源或标题无效");
      const source = item.query ? queryBinding(item.query) : item.source;
      const resolved = resolveObservationSource(source, sources, queries);
      const g = item.grid;
      if (
        !g ||
        ![g.x, g.y, g.w, g.h].every(Number.isSafeInteger) ||
        g.x < 0 ||
        g.y < 0 ||
        g.w < 1 ||
        g.h < 1
      )
        throw new Error("Widget 位置无效");
      if (item.range) validateChartRange(item.range);
      if (!isWidgetSizeAllowed(resolved.data, item.view, `${g.h}x${g.w}`))
        throw new Error("表达方式或尺寸与数据源不兼容");
      ids.add(item.id);
      return {
        ...dashboardLayout.panels[0],
        panel_id: item.id,
        grid: { x: g.x, y: g.y, w: g.w, h: g.h },
        size: panelSizeForGrid(g),
        channels: {
          source,
          title: item.title,
          expressionView: item.view,
          ...(item.range ? { range: JSON.stringify(item.range) } : {}),
        },
      };
    },
  );
  return { layout_version: 1, name: file.name, panels };
}
