import { expect, it } from "vitest";
import { restoreWorkflowExplorerView } from "./workflow-explorer-view";
it("bounds and allowlists persisted directory state", () => {
  const defaults = restoreWorkflowExplorerView();
  for (const value of [
    "{",
    JSON.stringify({ ...defaults, version: 2 }),
    JSON.stringify({ ...defaults, versions: "guess" }),
    JSON.stringify({ ...defaults, page: -1 }),
  ])
    expect(restoreWorkflowExplorerView(value)).toEqual(defaults);
  expect(
    restoreWorkflowExplorerView(
      JSON.stringify({ ...defaults, query: "r1", authority: "approved" }),
    ),
  ).toEqual({ ...defaults, query: "r1" });
});
