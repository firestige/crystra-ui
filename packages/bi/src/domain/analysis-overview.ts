import type { WidgetData, View } from "./widget-families";
import type { MonitoringWidgetSize } from "./widget-catalog";
export interface OverviewFilters {
  group: "provider" | "model";
  workflow: string;
  role: string;
  tokens: "total" | "input" | "output";
}

export type ObservationSources = Record<
  string,
  {
    topic?: "resources" | "quality";
    data: WidgetData;
    view: View;
    size: MonitoringWidgetSize;
    empty?: boolean;
    unavailableReason?: string;
  }
>;
