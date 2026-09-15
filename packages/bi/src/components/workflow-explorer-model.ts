/** Directory projection only. Latest selection is supplied by the owner, never inferred by the viewer. */
export interface WorkflowDefinitionEntry {
  definitionId: string;
  revision: string;
  title: string;
  purpose?: string;
  packageName?: string;
  status?: "DRAFT" | "CONFIRMED" | "DEPRECATED";
  isLatest?: boolean;
  createdAt?: string;
  updatedAt?: string;
  nodeCount?: number;
  thumbnail?: string;
  pinned?: boolean;
}
export interface WorkflowExplorerQuery {
  query: string;
  filter: "all" | "confirmed" | "draft";
  sort: "updated" | "created" | "name";
  versions: "latest" | "all";
}
export const workflowEntryKey = (
  entry: Pick<WorkflowDefinitionEntry, "definitionId" | "revision">,
) => JSON.stringify([entry.definitionId, entry.revision]);
export function queryWorkflowDefinitions(
  entries: readonly WorkflowDefinitionEntry[],
  query: WorkflowExplorerQuery,
) {
  const latest = new Map<string, WorkflowDefinitionEntry[]>();
  for (const entry of entries)
    if (entry.isLatest === true)
      latest.set(entry.definitionId, [
        ...(latest.get(entry.definitionId) ?? []),
        entry,
      ]);
  const selected =
    query.versions === "all"
      ? entries
      : [...latest.values()]
          .filter((group) => group.length === 1)
          .map((group) => group[0]);
  const text = query.query.trim().toLocaleLowerCase();
  return selected
    .filter(
      (entry) =>
        (!text ||
          [
            entry.definitionId,
            entry.revision,
            entry.title,
            entry.packageName,
            entry.purpose,
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase()
            .includes(text)) &&
        (query.filter === "all" ||
          entry.status ===
            (query.filter === "confirmed" ? "CONFIRMED" : "DRAFT")),
    )
    .sort((a, b) => {
      const pinned = Number(b.pinned === true) - Number(a.pinned === true);
      if (pinned) return pinned;
      if (query.sort === "name")
        return (
          a.title.localeCompare(b.title) ||
          workflowEntryKey(a).localeCompare(workflowEntryKey(b))
        );
      const av = Date.parse(
          (query.sort === "created" ? a.createdAt : a.updatedAt) ?? "",
        ),
        bv = Date.parse(
          (query.sort === "created" ? b.createdAt : b.updatedAt) ?? "",
        );
      return (
        (Number.isFinite(av) && Number.isFinite(bv)
          ? bv - av
          : Number.isFinite(av)
            ? -1
            : Number.isFinite(bv)
              ? 1
              : 0) || workflowEntryKey(a).localeCompare(workflowEntryKey(b))
      );
    });
}
