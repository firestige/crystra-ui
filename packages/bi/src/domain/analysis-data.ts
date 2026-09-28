import type {
  DeliverySearchRecord,
  DeliverySearchField,
} from "./delivery-search";
import type { OverviewFilters } from "./analysis-overview";
import type { ObservationChart } from "./observation-settings";
import type { ObservationQueryCatalog } from "./observation-query";
import type { MatrixData } from "./widget-families";
import type { TraceView } from "./trace/trace-view";
import type { ObservationSources } from "./analysis-overview";
export interface AnalysisData {
  referenceDate: string;
  /** Host reports missing data integration separately from an empty result. */
  unavailableReason?: string;
  provenance?: { label: string; description: string };
  tasks: readonly { id: string; name: string }[];
  roles: readonly string[];
  workflows: readonly { id: string; label: string }[];
  deliveries: DeliverySearchRecord[];
  searchFields: DeliverySearchField[];
  overview: (period: string, filters: OverviewFilters) => ObservationSources;
  queries: (
    period: string,
    filters: OverviewFilters,
  ) => ObservationQueryCatalog;
  trace: (delivery: DeliverySearchRecord) => TraceView | null;
  matrix: (chart: ObservationChart, deliveries: string[]) => MatrixData;
}
