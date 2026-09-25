# Task workbench display

Owner: Crystra-ui. `TaskWorkbench` provides the five peer surfaces (需求 / 计划 /
执行 / 审核 / 交付), persistent navigation, independent scrolling, and controlled
selection. Task navigation mounts in the shared PageHeader navigation slot, using
the same baseline underline styling as Workflow Studio and Analysis. The optional
`navigationContainer` on Tabs portals only the tab list; panels stay in the bench
with their original IDs, state and keyboard relationships. It reuses public `Tabs`, `Card`, `EmptyState`, and `Typography` from
`crystra-ui-core`. Hidden surfaces stay mounted; switching surfaces never writes
Task state or changes Chat/Session identity.

Authoritative design assets:
`/Users/firestige/Projects/workflow-self-recursive/tmp/20260907/Crystra-ui-design`

References: `MASTER.md`, `pages/task-detail/README.md` and the five surface docs,
`components/review-surfaces.md`, `assets/crystra-task-work-v8-sidebar.html`.
The staged implementation owns layout and slots, not owner data contracts. Missing
projections retain static card structures with explicit unavailable feedback.
They do not claim confirmed empty data, progress, a pending Gate count or a
successful delivery. A supplied projection replaces its entire surface slot.

The shared Tabs primitive supplies arrow/Home/End focus navigation and Enter/Space
activation. System focus is separate from user selection. No approval, retry,
pause or other business-write control is introduced. Long populated projections
must use the existing FullBenchViewer / dedicated document or graph viewers;
they are not implemented by the unavailable card skeletons.

This is the initial bench shell and unavailable-state migration. Populated
five-surface projections and drill-down views remain to be migrated after their
owner interfaces are connected; this is not a claim of full HTML feature parity.

## Grilling cards

`GrillingWorkbench` replaces the generic requirement skeleton with a compact
`GrillingOverview`, a question map and a live brief in the design's 0.9:1.35
columns. Brief changes are nested in the brief. It reuses Card, Typography, Chip,
EmptyState and FullBenchViewer. Data is passed as one `GrillingProjection` revision;
UI never infers confirmation, question counts or additions from messages.
Added topics retain their reason and source; missing source is explicit. The
read-only expand/back flow keeps the Task Header and Chat mounted. Missing data
and confirmed empty collections have different content. Dev-only design data is
in `dev/layout/previews/grilling-fixture.ts` and the existing Header-based preview.
The real task still awaits the owner projection; no example data is used there.

FullBenchViewer composes Card directly: title uses `heading`, expand/back uses
`actions`, and preview/full contents use the content slot. Its local styling owns
only height allocation and scrolling; border, padding, radius, surface and shadow
are inherited from Card without a separate viewer surface rule.

## Plan cards

`PlanWorkbench` uses Card for the overview, outcome/criteria, graph projection and
three independent readiness groups. Attention and revision changes use the shared
Card-backed FullBenchViewer. Plan document mode keeps a fixed Card header with
return action and read-only chapter navigation. Data is a single PlanProjection
revision; normal Task reads do not create one from Delivery or Evidence records.
Summary/full DAG are separate ReactNode projection slots. `PlanGraph` supplies a
read-only predecessor graph, node details, conditions, and Gate labels/evidence
requirements. It does not borrow executable Workflow state. No mutations or
approval controls are introduced.

`crystra-dsh/task-workbench/plan-draft-view.tsx` owns draft.1 adaptation via
`plan-draft.ts`; the presentation components receive stable projections only.
The isolated preview imports the contracts proposal's `example.json` directly.
The older `previews/plan-fixture.ts` is no longer used by this preview.
Task/Plan/revision identity keys the view to reset navigation when versions change.
Free chapter titles and parent hierarchy are retained; basic CommonMark renders
without raw HTML execution or unsafe links. Missing goal/readiness/review state
stays unavailable, rather than being inferred from a chapter or graph shape.

The draft adapter checks graph cycles, local references used by the projection,
unique IDs per collection and chapter hierarchy. It currently supports
`criterionSatisfied` and `gateDecision`, rejecting unsupported expressions. These
are UI integrity checks, not a complete protocol schema or Execution evaluator.
Live Task Plan reads remain pending the owner's API; no fixture is injected there.

## Shared semantic first row

All five surfaces use the public `WorkbenchSummaryCard`, composed directly from
Card. It owns icon treatment, title/abstract, facts, notices, actions and compact
layout adaptation. Pages supply semantic content and tone instead of custom row
CSS. Grilling/Plan design previews use primary; success/warning/danger are available
for owner-provided states. Unavailable live projections stay neutral, never implying
readiness or pending decisions. Ordinary cards retain the D17 subtle border; explicit
semantic overview tones use Card's existing semantic border/background tokens.

Plan DAG uses the public `WorkflowMapReadonly`: the existing `layoutWorkflowMap`
ELK engine, `useWorkflowMapViewport` D3 gestures and `frameMap` camera fitting.
`WorkflowMapNodeGlyph` is shared with the Workflow editor, including its tokens
and node shapes. Plan-specific IDs and conditions remain in the DSH projection;
Gate uses a decision shape, and a milestone is not rendered as an executed end.
The read-only renderer has no sample data, Workflow editing or execution actions.
The former manually ranked SVG positioning and Bézier routing are removed.

## Execution monitor — Delivery detail deferred

Only the Plan Run overview, Wave outcomes, graph selection and monitor freshness
are currently exposed. Selecting a Wave stays in the overview. Delivery drilldown,
Action call cards, per-Action details and identity/copy controls have been removed
from the active UI following user review; the former text list did not communicate
actual invocation order visually.

A future Delivery view must make actual invocation paths, parallelism, joins and
repeated calls readable directly in the Workflow activity graph. It must not use a
separate list as a substitute or create a second Trace viewer. Existing isolated
simulation data remains a dev input for the Plan overview, not an accepted Delivery
visualization or a published Execution contract.

Execution backend handoff remains https://github.com/firestige/crystra/issues/278.
Current-Plan file snapshot, Observation reduction, recovery and read/subscription
remain Execution-owned. UI has no Evidence/Trace/request-response dependencies.

## Gate and Delivery surfaces

GateWorkbench consumes a host-ordered, triggered human-intervention queue and a
controlled selected identity. The host callback must atomically bind the Input
reply subject with gate/revision. The isolated preview displays this subject;
real chat binding and decision submission are not implemented by this UI.
Confirmed decisions must already pass owner admission (exact original confirmed
content, scope and receipt); the view is not a semantic authorization validator.
AI interpretation stays candidate. Selection/revision changes reset the inspector;
return within a version preserves the queue and underlying content. Empty queue
is distinct from unavailable projection and does not imply Task completion.

DeliveryWorkbench consumes owner-provided readiness, candidates, acceptance,
risks and Task economics. Invalidated readiness becomes neutral pending calculation,
including acceptance verdicts. It never computes readiness from execution/analysis
metrics. Exact supplied resource content opens read-only; missing content is explicit,
without latest-version fallback. No approve/publish/accept/download actions exist.
The fixtures in review-delivery-fixture.ts are isolated examples, not live fallbacks.
Task pages render unavailable states until owner projections are integrated.
