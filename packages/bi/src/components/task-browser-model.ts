import type { SemanticTone } from "./design-system";
/** Read-only consumer projection, not a new Task lifecycle enum. Omitted facts remain unknown. */
export interface BrowserTaskRecord {
  id: string;
  title: string;
  goal?: string;
  workspace?: { name: string; path: string } | null;
  status?: { label: string; tone: SemanticTone } | null;
  active?: boolean | null;
  createdAt?: string | null;
  lastActivityAt?: string | null;
  /** CNY only, following the accepted Task Browser display contract. */
  cost?: number | null;
  attention?: { count: number; severity: "error" | "warning" | null } | null;
  progress?: { completed: number; total: number; scope: string } | null;
  thumbnail?: string;
  pinned?: boolean;
}
export interface TaskBrowserQuery {
  query: string;
  filter: "all" | "active" | "attention";
  sort: "activity" | "created" | "cost";
}
export function taskProgress(task: BrowserTaskRecord): number | null {
  const value = task.progress;
  if (
    task.active !== true ||
    !value ||
    !value.scope.trim() ||
    !Number.isInteger(value.completed) ||
    !Number.isInteger(value.total) ||
    value.total <= 0 ||
    value.completed < 0 ||
    value.completed > value.total
  )
    return null;
  return Math.round((100 * value.completed) / value.total);
}
export function queryBrowserTasks(
  tasks: readonly BrowserTaskRecord[],
  query: TaskBrowserQuery,
) {
  const text = query.query.trim().toLocaleLowerCase();
  const rank = (task: BrowserTaskRecord) => {
    const value =
      query.sort === "cost"
        ? task.cost
        : Date.parse(
            (query.sort === "created" ? task.createdAt : task.lastActivityAt) ??
              "",
          );
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  };
  return tasks
    .filter(
      (task) =>
        (!text ||
          [
            task.id,
            task.title,
            task.goal,
            task.workspace?.name,
            task.workspace?.path,
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase()
            .includes(text)) &&
        (query.filter !== "active" || task.active === true) &&
        (query.filter !== "attention" || (task.attention?.count ?? 0) > 0),
    )
    .sort((a, b) => {
      if (a.pinned !== b.pinned)
        return Number(b.pinned === true) - Number(a.pinned === true);
      const av = rank(a),
        bv = rank(b);
      if (av === null && bv !== null) return 1;
      if (bv === null && av !== null) return -1;
      return (
        (av !== null && bv !== null ? bv - av : 0) || a.id.localeCompare(b.id)
      );
    });
}
