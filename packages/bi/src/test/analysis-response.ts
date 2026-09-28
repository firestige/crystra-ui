import { CATALOG_COORDINATES } from "../domain/evolution/client";
function receipt(taskIdentity: string | string[]) {
  const taskIds = Array.isArray(taskIdentity) ? taskIdentity : [taskIdentity];
  return {
    context_version: 1,
    selection: { selection_version: 1, task_ids: taskIds },
    as_of: "2026-08-28T01:00:00.000000Z",
    resolved_at: "2026-08-28T01:00:01.000000Z",
    task_population: taskIds.map((taskId) => ({
      task_id: taskId,
      memberships: [],
      cohort_coordinates: {},
      exclusions: ["UNDEFINED_TASK_MEMBERSHIP"],
    })),
    catalog: {
      catalog_id: "agentops.evaluation.metric-catalog",
      version: "2.0.0",
      semantic_digest:
        "851692f9d4a549d21f3c741470737eabb0d40b5f03cf10ffae76e1892023741e",
      observation_profile: "1.0.0",
    },
    evidence_bindings: taskIds.map((taskId) => ({
      route: "/v1/evidence/tasks",
      canonical_filter: {
        as_of: "2026-08-28T01:00:00.000000Z",
        task_id: taskId,
      },
      contract_revision: "1.0.0",
      observation_profile: "2.0.0",
      read_model_revision: "2.0.0",
      route_snapshot: "task-snapshot-1",
      completion_state: "COMPLETE",
    })),
    input_refs: [],
    workflow_resolutions: [],
    population_state: "OPEN",
  };
}

function metricResults() {
  return CATALOG_COORDINATES.map((coordinate) => ({
    metric_id: coordinate.slice(0, coordinate.lastIndexOf("@")),
    metric_version: "2.0.0",
    slices: [
      {
        slice_key: {},
        state: "UNAVAILABLE",
        withholding_reason: "MISSING_INPUT",
        measures: {},
        coverage: {
          numerator: "0",
          denominator: "0",
          raw_ratio: null,
          state: "NO_POPULATION",
          alert: null,
        },
        compatibility: {},
        exclusions: [],
        missing_inputs: [],
        provenance_refs: [],
      },
    ],
  }));
}

export function singleResponse(taskId: string | string[] = "task-a") {
  return {
    api_version: 1,
    mode: "SINGLE",
    result: {
      tag: "SIDE_RESULT",
      receipt: receipt(taskId),
      metric_results: metricResults(),
    },
  };
}
