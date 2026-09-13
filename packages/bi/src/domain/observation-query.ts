import type { MonitoringWidgetSize } from "./widget-catalog";
import type { View, WidgetData } from "./widget-families";
export interface ObservationQuery {
  metric: string;
  providers: "all" | readonly string[];
  models: "all" | readonly string[];
  groupBy: "none" | "provider" | "model" | "role";
  time: "summary" | "daily";
  tokens: "total" | "input" | "output";
}
export interface ObservationMetric {
  id: string;
  label: string;
  topic: "resources" | "quality";
  description: string;
  groups: readonly ObservationQuery["groupBy"][];
  times: readonly ObservationQuery["time"][];
  dimensions: boolean;
}
export interface ObservationQueryResult {
  topic: "resources" | "quality";
  data: WidgetData;
  view: View;
  size: MonitoringWidgetSize;
  empty?: boolean;
}
export interface ObservationQueryCatalog {
  metrics: readonly ObservationMetric[];
  providers: string[];
  models: { id: string; provider: string; label: string }[];
  resolve(query: ObservationQuery): ObservationQueryResult;
}
// Layout channels are strings; the exported layout uses a structured query object.
const prefix = "metric-query:";
export const queryBinding = (query: ObservationQuery) =>
  prefix + JSON.stringify(query);
export const queryFromBinding = (
  source: string,
): ObservationQuery | undefined =>
  source.startsWith(prefix)
    ? JSON.parse(source.slice(prefix.length))
    : undefined;
