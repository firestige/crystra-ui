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
- `/workflows`: WorkflowBrowserSurface using the host-owned local catalogue and exact revision links.
- `/workflows/:definitionId?revision=v3&from_task_id=...&view=studio|resources|crystallization`: WorkflowStudioPage with the original v8 workflow workbench; preserves exact revision and source task in URL.
- `/analysis?view=dashboard|traces|reports`: AnalysisV8Assembly, existing v8 observation study with shared Header and dev-owned routing.

`/` retains the initial task preview. `/tasks/new` is the new-task empty state and does not create a Task or Session. Unknown paths show a not-found page. These are local preview routes, not a published DSH routing contract. Browser history, direct links and refresh are supported; session/draft restoration is not implemented.

## Delivery ownership

### Workflow v8 assembly

`WorkflowV8Assembly.tsx` is the dev host adapter. It composes the existing
`WorkflowMapWorkbench`, `WorkflowResourceBrowser`, and `WorkflowCrystallization`
with the shared `WorkflowStudioPage`, Header, Tabs, and draggable Chat split.
The original `WorkflowMapIR` remains the semantic contract. No replacement drawing
engine or parallel workbench implementation is introduced.

`index.html` loads `workflow-map-candidate.js` and
`workflow-resource-workspaces.js` from the authoritative design asset directory
before the React entry point. These are the layout and resource snapshots used by
`crystra-workflow-studio-v8.html`. The selected local workflow route is preserved,
but the displayed graph/resources are explicitly v8 design samples, not that
local workflow's data. Candidate layouts only cover the bundled samples.

Chat commands, resource editing, draft saving, and publish checks retain the
original local demo behavior; they do not call an Agent, write workflow-package
files, or publish real revisions. Markdown rendering reuses the DSH primitive.
Both workbench sections stay mounted so tab changes preserve resource selection,
editor state, and the Chat draft. This assembly does not change the 3085 host.

Verify against the running dev server:

```sh
node dev/layout/tests/workflow-v8-assembly.mjs
```

The browser check covers graph scope navigation, design/publish dialogs, resource
Markdown and relation graph, crystallization checks, URL context preservation,
fixed Header height, and retained Chat/resource state.

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

## Task Browser calibration

Open `/tasks` on port 3086. The React surface is in
`packages/bi/src/task-browser/`; its Crystra-dsh adapter is staged in
`dev/layout/components/crystra-dsh/tasks/task-browser.tsx`. Sidebar and Browser
subscribe to the same Execution Task resource. Gallery/List selection, search,
filters, sorting, grouping, incremental Gallery rendering and List pagination
are controlled by the surface. Task links enter the existing Task Workbench;
New Task enters `/tasks/new`.

The current owner snapshot only supplies Task identity, title and timestamps.
Workspace, lifecycle, progress, attention and cost remain unknown when absent;
unknown active/attention facts do not qualify for those filters. Archive remains
disabled until an owner write action is connected. This calibration route does
not deploy or replace the frozen port 3085 host.

### Workflow split after visual calibration

- `crystra-ui-core` publicly exports `WorkflowMapWorkbench`,
  `WorkflowResourceBrowser`, and `WorkflowCrystallization`. They receive IR,
  resource snapshots, comparison data, render capabilities, and intent callbacks.
  Canvas selection, zoom, disclosure, tabs, dialogs, and editor drafts remain
  local visual state. There is no graph authoring/edge creation UI.
- Crystra-dsh `useWorkflowResourceActions` owns asynchronous resource actions,
  snapshot replacement after success, and the unsaved unload guard. Its port
  isolates filesystem/RPC adapters from the visual components.
- `dev/layout/workflow` owns all preview fixtures, in-memory resource mutations,
  Chat simulation, localStorage drafts, and validation/publish demonstrations.
  Those tools enter the map through the `actions` slot; they are not part of the
  production component. The standalone HTML preview uses `LegacyPreview` as its
  compatibility adapter.
- Resource direct editing remains supported. Writes are callbacks; pending writes
  lock editing, rejection preserves the draft, and success replaces the snapshot.
  Production persistence and actual Agent/file observation are not connected yet.

The UI app typecheck includes the preview adapter and its one DSH hook so both
preview entry points are checked. Library declaration/build entry remains
`src/public.ts` and does not export or bundle preview adapters.

### Workflow header width adaptation

The shared header stays 88px high and all three navigation tabs remain expanded.
The map header uses a shrinkable identity column and 12px column gaps. Its controlled
WorkflowMapToolbar observes the allocated context slot (not the device model):
760px and above shows full commands; 460–759px retains zoom plus grouped menus;
below 460px uses View, Display and Check icon actions. Buttons are 36px high,
menus open below the header, and Display keeps path, direction and hierarchy
choices together. Menu's optional icon-only trigger preserves its accessible label.

Run `node dev/layout/tests/workflow-header-responsive.mjs` against dev, or set
`CRYSTRA_HEADER_URL` to an authenticated production URL. It checks height,
scroll overflow, navigation separation, menu bounds and command interactions.

Header ownership convergence: `PageHeader layout="actions"` owns the grid and
action-slot width. WorkflowMapToolbar observes its own element through the same
width observer used by AdaptiveChoice, without inspecting ancestor selectors.
Groups and separators use ButtonGroup and Divider. The optional `status` input
is display-only; absence means no status label, never an inferred draft state.
The formal host currently omits status until a contract supplies it.

Workflow Browser uses the authoritative `crystra-workflow-explorer-v8.html` as
its layout reference, with Task Browser's accepted shared controls. ResourceBrowserHeader,
ResourceGalleryCard, ResourceTableRow, AdaptiveChoice, ActionMenu and the shared
resource-browser.css own the visual building blocks. Host adapters own navigation
and clipboard effects. Current local catalogues expose one revision per definition;
historical versions, creation and archive controls remain explicitly unavailable.
Package status is displayed from semantic CONFIRMED/DRAFT values. Node counts and
latest file modification times come from local package reads; creation dates are
not inferred. No remote package writes or fixture rows are introduced.

Resource browser visual convergence: Task and Workflow share ResourceViewToggle
(controlled Gallery/List icon-only ToggleSwitch) and ResourceStatus (dot plus text).
ResourceGalleryCard and ResourceTableRow mark their component ownership so dev's
legacy palette rewriting cannot override primitive borders. The card subtitle row
reserves space for its action hit target, keeping status and hover areas separate.

## Analysis v8 dev assembly

`AnalysisV8Assembly.tsx` mounts the exported `AnalysisSurface` inside
`AnalysisDataProvider`. Design authority:
`/Users/firestige/Projects/workflow-self-recursive/tmp/20260907/Crystra-ui-design/assets/crystra-analysis-audit-v8.html`
and its `pages/analysis-audit.md` contract.

The three routes expose Dashboard widgets/layout editing, Delivery directory with
Waterfall/Tree traces, and comparison observation settings with the three-column
editor. The dev adapter owns route changes and query parameters. Formal components
receive view, source context and navigation callbacks; they never manipulate
History or host Sidebar elements. The standalone HTML adapter lives in test-harness.
Shared `LayoutHeader` preserves the 88px shell height.

`AnalysisData` is a temporary presentation input for snapshots and synchronous preview
projections, not an Evidence API or envelope. The production page can pass `{}`.
UI retains presentation and draft editing only. Semantic catalog
and observation-setting contracts live in domain modules; fixture records, metric
aggregation and trace construction live exclusively in test-harness. The explicit
reference date (2026-09-09 in dev) keeps relative ranges deterministic without a
fixed date in the formal surface. A production host must supply Evidence-owned
results and persistence; preview aggregation is not production metric logic.

Editors reuse `SelectField`, `TextInput` and `Button`. SelectField supports native
option groups and an unframed mode for fields already wrapped in a label. Shared
`ModalFrame` supports controlled or native-ref modal lifecycle and content slots;
Analysis editors and ResourceDialog use the same primitive.

Check: `node dev/layout/tests/analysis-v8-assembly.mjs`. It exercises routing/back,
layout editing, trace selection and view switching, comparison save/cancel, and
88px header geometry at desktop and iPad landscape widths. Boundary tests guard
against reintroducing fixture/navigation dependencies or handwritten form controls.
Only dev is wired; 3085 is unchanged.

Analysis ownership convergence: confirmed settings and layouts are controlled props.
The dev `useAnalysisPreviewState` supplies preview configuration and synthetic refresh;
DSH owns its application-session configuration separately. Refresh cadence/count/actions
are host inputs; formal UI contains no refresh scheduler. Source notices are explicit
host inputs rather than inferred from the existence of IDs. Calendar and Popover share
`useDismissibleLayer`; toast dismissal uses IconButton. No Evidence loading hook or
new data envelope is implemented in this step.
