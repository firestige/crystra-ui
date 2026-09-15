import type { AnalysisWorkspaceData } from "../components/analysis-workspace";
import {
  deliveryDirectoryRecords,
  deliveryDirectorySearchFields,
} from "./delivery-directory-fixture";
import {
  observationSamples,
  observationTasks,
  observationTrace,
  roles,
} from "./observation-fixture";
import { overviewSources } from "./observation-overview-fixture";
import { createObservationQueryCatalog } from "./observation-query-fixture";

export const analysisExplorationData: AnalysisWorkspaceData = {
  tasks: observationTasks,
  samples: observationSamples,
  roles,
  workflows: [
    { id: "implementation", name: "Implementation" },
    { id: "research", name: "Research" },
  ],
  deliveries: deliveryDirectoryRecords,
  searchFields: deliveryDirectorySearchFields,
  sources: overviewSources,
  queries: createObservationQueryCatalog,
  trace: (r) => observationTrace(r.taskId, r.workflowVersion, r),
};
