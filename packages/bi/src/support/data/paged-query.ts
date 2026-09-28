/** Client-side adapter result, NOT an Evidence/Evaluation wire envelope. */
export interface ResolvedPage<Row, Continuation, Meta = undefined> {
  rows: readonly Row[];
  /** null means this traversal has ended; does not describe Delivery completeness. */
  next: Continuation | null;
  meta?: Meta;
}
export interface TypeResolver<Wire, Row, Continuation, Meta = undefined> {
  /** Validate/resolve the wire response here. Invalid revisions must throw. */
  resolve(wire: Wire): ResolvedPage<Row, Continuation, Meta>;
}
export interface PageRequest<Continuation> {
  signal: AbortSignal;
  /** undefined means the first request. May carry cursor + route snapshot, or offset. */
  continuation: Continuation | undefined;
}
export interface PagedQueryAdapter<Wire, Row, Continuation, Meta = undefined> {
  /** Host closure binds immutable source, scope, auth and page size. No guessed URLs. */
  read(request: PageRequest<Continuation>): Promise<Wire>;
  resolver: TypeResolver<Wire, Row, Continuation, Meta>;
  mergeMeta?: (
    previous: Meta | undefined,
    next: Meta | undefined,
  ) => Meta | undefined;
}
export interface PagedQueryState<Row, Meta = undefined> {
  phase: "idle" | "loading" | "ready" | "error";
  operation: "replace" | "append" | null;
  rows: readonly Row[];
  hasMore: boolean;
  error: Error | null;
  meta: Meta | undefined;
}
export interface PagedQuery<Row, Meta = undefined> {
  getSnapshot(): PagedQueryState<Row, Meta>;
  subscribe(listener: () => void): () => void;
  actions: {
    load(): Promise<void>;
    loadMore(): Promise<void>;
    refresh(): Promise<void>;
  };
  dispose(): void;
}

/**
 * One resource per immutable query in the host's apply scope. Share it across panels.
 * Stores only the current loaded traversal; never eagerly downloads every page.
 * React consumers do not own its lifetime. Dispose on scope eviction/shutdown.
 */
export function createPagedQuery<Wire, Row, Continuation, Meta = undefined>(
  adapter: PagedQueryAdapter<Wire, Row, Continuation, Meta>,
): PagedQuery<Row, Meta> {
  let state: PagedQueryState<Row, Meta> = {
    phase: "idle",
    operation: null,
    rows: [],
    hasMore: false,
    error: null,
    meta: undefined,
  };
  const listeners = new Set<() => void>();
  // Synchronous state mutations, independent of transport and response resolution.
  const publish = (patch: Partial<PagedQueryState<Row, Meta>>) => {
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  };
  let continuation: Continuation | null = null;
  let initialized = false;
  let generation = 0;
  let disposed = false;
  let controller: AbortController | undefined;
  let pending: Promise<void> | undefined;

  const request = (operation: "replace" | "append"): Promise<void> => {
    if (disposed) return Promise.resolve();
    const current = ++generation;
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;
    const next = operation === "append" ? continuation! : undefined;
    if (operation === "replace") {
      initialized = false;
      continuation = null;
    }
    // Install pending before notifying subscribers, so reentrant loads deduplicate too.
    const job = Promise.resolve()
      .then(() => {
        if (disposed || current !== generation) return;
        return adapter.read({ signal, continuation: next }).then((wire) => {
          if (disposed || current !== generation) return;
          const page = adapter.resolver.resolve(wire);
          const meta =
            operation === "append" && adapter.mergeMeta
              ? adapter.mergeMeta(state.meta, page.meta)
              : page.meta;
          continuation = page.next;
          initialized = true;
          publish({
            phase: "ready",
            operation: null,
            error: null,
            meta,
            rows:
              operation === "append"
                ? [...state.rows, ...page.rows]
                : [...page.rows],
            hasMore: page.next !== null,
          });
        });
      })
      .catch((error: unknown) => {
        if (!disposed && current === generation) {
          publish({
            phase: "error",
            operation: null,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      })
      .finally(() => {
        if (current === generation) pending = undefined;
      });
    pending = job;
    publish({
      phase: "loading",
      operation,
      error: null,
      ...(operation === "replace" ? { hasMore: false } : {}),
    });
    return job;
  };

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      if (disposed) return () => {};
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    actions: {
      load: () =>
        disposed
          ? Promise.resolve()
          : (pending ?? (initialized ? Promise.resolve() : request("replace"))),
      loadMore: () =>
        disposed
          ? Promise.resolve()
          : (pending ??
            (initialized && continuation !== null
              ? request("append")
              : Promise.resolve())),
      refresh: () => request("replace"),
    },
    dispose() {
      disposed = true;
      generation++;
      controller?.abort();
      pending = undefined;
      listeners.clear();
    },
  };
}

export interface RowSelection<Row> {
  filter?: (row: Row) => boolean;
  sort?: (left: Row, right: Row) => number;
  offset?: number;
  limit?: number;
}
/** Local selection/paging of loaded rows only. Never mutates the source or queries. */
export function projectRows<Row>(
  rows: readonly Row[],
  selection?: RowSelection<Row>,
): readonly Row[];
export function projectRows<Row, Result>(
  rows: readonly Row[],
  selection: RowSelection<Row>,
  project: (selected: readonly Row[]) => Result,
): Result;
export function projectRows<Row, Result>(
  rows: readonly Row[],
  selection: RowSelection<Row> = {},
  project?: (selected: readonly Row[]) => Result,
): Result | readonly Row[] {
  const { filter, sort, offset = 0, limit } = selection;
  if (
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0))
  ) {
    throw new RangeError(
      "Local offset and limit must be nonnegative safe integers",
    );
  }
  let selected = filter ? rows.filter(filter) : [...rows];
  if (sort) selected.sort(sort);
  selected = selected.slice(
    offset,
    limit === undefined ? undefined : offset + limit,
  );
  return project ? project(selected) : selected;
}
