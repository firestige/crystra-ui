# Crystra UI migration dev server

Run from `/Users/firestige/Projects/wsr-ui`:

```sh
npm run dev:layout
```

URL: http://127.0.0.1:3086 — Vite + React Fast Refresh, strict port.

Authoritative design lookup directory for subsequent migration work:
`/Users/firestige/Projects/workflow-self-recursive/tmp/20260907/Crystra-ui-design`

Start with README.md, MASTER.md, foundations/layout.md, components/shell-and-sidebar.md.
The DSH-owned Sidebar lives under `components/crystra-dsh/sidebar/`. Task records are read from Execution; workflow preview records live in fixtures.ts. The shared PageHeader preserves the original markup and SVG, receiving its content through props.
index.html loads that design's local Tailwind runtime and CSS assets directly, preserving the original design styling. The component-library CSS also uses its existing Vite Tailwind compiler so shared primitives render correctly. No external CDN is required.
Placeholders.tsx exposes separate ChatPlaceholder and BenchPlaceholder components.
Sidebar navigation, collapse/expand, temporary directories, search, sorting, filtering and version visibility are connected. The sidebar Settings button opens the DSH-owned Workflow source settings dialog. Harness switching still requires a host callback and is disabled. Task reads expose loading, failure and retry states without fixture fallback.

This is a standalone React SPA preview, not a DSH host integration or production build. Replace placeholders incrementally in TSX. Existing library entry points remain separate.

## Routes

- `/tasks`: TaskBrowserPage, full-width Bench placeholder.
- `/tasks/:taskId`: TaskDetailPage, Chat placeholder + five-surface Task workbench.
- `/workflows`: WorkflowExplorerPage, full-width Bench placeholder.
- `/workflows/:definitionId?revision=v3&from_task_id=...`: WorkflowStudioPage, Chat + Bench placeholders; preserves exact revision and source task in URL.
- `/analysis?view=dashboard|traces|reports`: AnalysisAuditPage, full-width Bench placeholder.

`/` retains the initial task preview. `/tasks/new` is the new-task empty state and does not create a Task or Session. Unknown paths show a not-found page. These are local preview routes, not a published DSH routing contract. Browser history, direct links and refresh are supported; session/draft restoration is not implemented.

## Delivery ownership

All deliverables from this session target production except the explicitly isolated development host. New components are staged under dev by their final owner, for later directory-based relocation:

```text
components/
  crystra-dsh/
    tasks/         # Execution adapter, shared store/actions/hook and connected views
    sidebar/       # Sidebar composition, behavior, types, CSS and tests
    task-workbench/ # Execution Task binding and host-scoped browsing store
  crystra-ui/
    pages/         # Page display frames, PageHeader, CSS and tests
    task-workbench/ # Controlled five-surface display and unavailable-state cards
App.tsx            # Dev composition
Placeholders.tsx    # Dev Chat / Bench slots
fixtures.ts        # Dev records only
```

Sidebar belongs to Crystra-dsh, not Crystra-ui. It imports existing public Icon and ExpandableSearchField primitives from `crystra-ui-core`. The dev/test alias resolves that package to current UI source for HMR without changing the ownership boundary. New staged components are not yet exported from either formal package. The dev app imports the staged components directly; there is no second implementation.

Five page display frames accept data and ReactNode slots; they do not own URLs, DSH sessions or mock business state.

Route parsing lives in Crystra-dsh `src/client/navigation/routes.js`. The dev-only History adapter and fixture landing page live here. DSH's actual navigation/session/slot/module-loader integration remains owned by Crystra-dsh and must be verified against the 0.1.5-rc.2 Web client before host delivery. The existing DSH repository pins 0.1.1-rc.2; this step does not upgrade that plugin or claim host integration is complete.

Staging under dev does not relax production requirements. Keep host-independent primitives in Crystra-ui and application Shell/Sidebar ownership in Crystra-dsh. Do not treat original HTML/DSH bundle globals as production dependencies. The design assets remain authoritative for subsequent work at the directory recorded above.

## Task data

Task data belongs to **Execution**, while analytical data belongs to **Evidence**.
`components/crystra-dsh/tasks/` provides a shared `useTasks()` hook over a host-owned
DSH 0.1.5-rc.2 store. Async `load`/`refresh` actions invoke the injected Execution
API; synchronous store mutations publish loading, ready and error snapshots.
Sidebar, Task Browser and Task Detail share this resource, including refresh state.
Bench remains a placeholder.

The Execution Task RPC is `/crystra-tasks` with `list` and `changes({ after })`.
It reads durable Task metadata and validated legacy Manifest associations, including
Tasks without a live runtime. Delivery completion never implies Task completion.
A revision-based long poll signals changes; the shared resource refreshes the full
snapshot, rejects stale reads, retains data on failure and reconnects after errors.
Analysis remains a separate Evidence consumer. No Evidence `tasks/list` fallback.

The production plugin registers the gateway in the existing DSH host. The dev shell
can either proxy to `CRYSTRA_EXECUTION_ORIGIN` (default `http://127.0.0.1:3085`), or
host exactly the same read gateway and Execution query in Vite. For the latter,
first build the sibling `wsr-execution` repository, then configure this ignored file:

```sh
# dev/layout/.env.local
CRYSTRA_EXECUTION_CONFIG=/absolute/path/to/execution.json
```

`task-query-dev-host.ts` is dev-only composition. It uses the Execution-owned
`openExecutionTaskQuery` entry point, reads the configured durable root, and never
starts or recovers runtimes or writes production records. It is not a new standalone
service. The browser uses the same RPC contract in both modes. Unavailable or corrupt
sources stay explicit errors. The local 3086 host currently uses the existing
acceptance installation's Execution config; local configuration is not committed.

Host mounting of the staged React components remains a later migration step. The
formal plugin's Task gateway is registered now, but updating an installed DSH plugin
is separate from editing the component repositories.

## Local Workflow data

Workflow rows now come from `components/crystra-dsh/workflows/use-workflows.ts`.
Sidebar and Explorer share one query; Studio resolves exact local identity/revision.
The reusable subscription/action engine lives under `components/crystra-dsh/shared`,
while Task and Workflow keep independent owner adapters and stores. Workflow fixtures
have been removed. Analysis navigation is still static, with Evidence as its data owner.

The dev host reads `CRYSTRA_WORKFLOW_BINDINGS` when set; otherwise it reads ignored
`dev/layout/workflow-directories.local.json`. Configure the user's selected directories:

```json
{
  "schemaVersion": "crystra.workflow-directories@1.0.0",
  "directories": [
    { "path": "/absolute/path/to/collection", "kind": "collection" }
  ]
}
```

Use `kind: "package"` for one editable Workflow package. No directory is selected by
default. A missing file shows “尚未绑定本地 Workflow 目录”; it is not a successful empty
catalogue. File edits and binding edits refresh the shared state automatically.
This authoring source is distinct from Execution's local archive index. Source files
are read-only in this migration step; no remote writes, publishing or automatic
rebindings occur. Bench remains a placeholder. Full contract and limits are documented
in the sibling `wsr-dsh/docs/local-workflow-catalogue.md`.

## Settings

The Sidebar footer opens the DSH-owned `settings/SettingsDialog` on any route.
Workflow sources can be added, removed or changed there. The host validates directory
paths and saves only the binding configuration, using a baseline revision to reject
stale writes. Saved selections refresh the shared Workflow list. Source Workflow files
remain read-only. Reopening the dialog reads persisted configuration.

## Chat / bench resizing

Task and Workflow page frames reuse `useChatSplit` and `ChatSplitDivider` from
`crystra-ui-core`, extracted from the Workflow preview (which now uses the same
implementation). The 6px separator supports pointer capture, cancellation, arrow
keys in 16px steps and Home/End limits. Mounted-container ResizeObserver updates
the limits. Dev page frames start at 38% Chat width with 360px Chat and 680px bench
minimums; Chat is capped at half the available width. Narrow hosts scroll rather
than collapse the reading minimums. Surface switches retain width; persistence
across page unmounts is not added.

## Base Header geometry

All routes use the same `PageHeader` identity/navigation/context slots, including
routes with no navigation. `page-header.css` owns the shared
`--crystra-layout-header-height` (88px); route content cannot change Header height.
Context feedback occupies its own bounded slot instead of adding title rows.
Task, Workflow and Analysis content therefore share the same vertical origin.

## Production Task Workbench integration (2026-09-21)

The accepted five surfaces and page frames now live in
`packages/bi/src/task-workbench/` and `packages/bi/src/task-layout/`, exported by
`crystra-ui-core`. Files in the former dev component directories are compatibility
re-exports, not a second implementation. Crystra-owned adapters, attention state,
Plan draft projection and animation live in `wsr-dsh/src/client/task-workbench/`;
its motion hook is under `src/client/preferences/`. The dev Task resource wrapper,
fixtures, simulated execution and standalone React root remain here.

Crystra-dsh mainline targets DSH 0.1.5-rc.2. The production Session Workbench is
registered through DSH slots; detailed owner projections are not replaced by demo
fixtures. See `wsr-dsh/docs/crystra-ui-adoption.md` for the mounting and API boundaries.
