import { describe, expect, it } from "vitest";
import {
  queryWorkflowDefinitions,
  workflowEntryKey,
  type WorkflowDefinitionEntry,
} from "./workflow-explorer-model";
const entries: WorkflowDefinitionEntry[] = [
  {
    definitionId: "a",
    revision: "r1",
    title: "Confirmed older",
    status: "CONFIRMED",
    isLatest: false,
  },
  {
    definitionId: "a",
    revision: "r2",
    title: "Draft current",
    status: "DRAFT",
    isLatest: true,
  },
  {
    definitionId: "b",
    revision: "opaque",
    title: "Other",
    status: "CONFIRMED",
    isLatest: true,
  },
];
const query = {
  query: "",
  filter: "all",
  sort: "updated",
  versions: "latest",
} as const;
describe("Workflow directory identity and version selection", () => {
  it("selects the adapter's exact latest before filtering, without falling back to an older confirmed revision", () => {
    expect(
      queryWorkflowDefinitions(entries, { ...query, filter: "confirmed" }).map(
        workflowEntryKey,
      ),
    ).toEqual([workflowEntryKey(entries[2])]);
    expect(
      queryWorkflowDefinitions(entries, { ...query, query: "older" }),
    ).toEqual([]);
  });
  it("keeps revision identities separate and does not guess latest from timestamps or opaque version strings", () => {
    expect(
      new Set(
        queryWorkflowDefinitions(entries, { ...query, versions: "all" }).map(
          workflowEntryKey,
        ),
      ).size,
    ).toBe(3);
    expect(
      queryWorkflowDefinitions([{ ...entries[0], isLatest: undefined }], query),
    ).toEqual([]);
    expect(
      queryWorkflowDefinitions(
        [{ ...entries[0], isLatest: true }, entries[1]],
        query,
      ),
    ).toEqual([]);
  });
  it("keeps unknown timestamps last, pins first, and searches package and exact revision", () => {
    const data = [
      ...entries,
      {
        definitionId: "c",
        revision: "sha:1",
        title: "Z",
        packageName: "exact-package",
        updatedAt: "2026-09-14T00:00:00Z",
        isLatest: true,
      },
    ];
    expect(queryWorkflowDefinitions(data, query)[0].definitionId).toBe("c");
    expect(
      queryWorkflowDefinitions(data, { ...query, query: "exact-package" })[0]
        .revision,
    ).toBe("sha:1");
    expect(
      queryWorkflowDefinitions(
        data.map((x) => ({ ...x, pinned: x.definitionId === "b" })),
        query,
      )[0].definitionId,
    ).toBe("b");
  });
});
