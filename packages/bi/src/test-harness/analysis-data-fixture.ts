import type { AnalysisData } from "../components/analysis-data";
import { referenceDate } from "./observation-clock";
import {
  observationTasks,
  roles,
  observationTrace,
} from "./observation-fixture";
import {
  deliveryDirectoryRecords,
  deliveryDirectorySearchFields,
} from "./delivery-directory-fixture";
import { overviewSources } from "./observation-overview-fixture";
import { createObservationQueryCatalog } from "./observation-query-fixture";
import { observationMatrix } from "./observation-settings";
/** Preview-only data adapter. Never export from the production package. */
export const analysisDataFixture: AnalysisData = {
  provenance: {
    label: "演示数据",
    description:
      "当前预览使用合成调用记录，不代表真实费率、性能或独立随机样本。",
  },
  referenceDate,
  tasks: observationTasks,
  roles,
  workflows: [
    { id: "implementation", label: "Implementation" },
    { id: "research", label: "Research" },
  ],
  deliveries: deliveryDirectoryRecords,
  searchFields: deliveryDirectorySearchFields,
  overview: overviewSources,
  queries: createObservationQueryCatalog,
  trace: (delivery) =>
    observationTrace(delivery.taskId, delivery.workflowVersion, delivery),
  matrix: observationMatrix,
};
