# Dashboard panel layout contract

Current accepted ownership: the stable Widget instance owns presentation and restorable display state; Dashboard owns placement and persistence of snapshots. See the [component contract](../../docs/design/crystra-ui/components/widget-component-contract.md). The current preview still stores expressionView in Dashboard; migration is pending. Catalog tables below describe existing compatibility APIs, not the complete current expression set.

This document defines how dashboard visualizers adapt to their legal grid sizes. A smaller panel is a
distinct information composition, not a scaled-down copy of a larger panel.

## Widget units

- One widget width unit is exactly `160px` (equivalent to `10rem` only at a 16px root font size).
- One widget height unit is exactly `160px`.
- Product-facing sizes in this document use **rows × columns** so `1×3` means one row high and three
  columns wide. The code representation remains `{ w: 3, h: 1 }`; every contract or test crossing
  that boundary must name both axes explicitly.
- Widget border-box dimensions are columns/rows * 160px + (columns/rows - 1) * 16px: 1x1=160x160, 2x2=336x336, 3x3=512x512px. This replaces the previous 160px-multiple outer-box ruling.
- The Widget grid uses fixed 16px gaps and equal inline padding. Spanning cards align with the corresponding small-card edges.
- Size choices are presented in the editing context menu (right click or Shift+F10), never a persistent select control. Choices come from WIDGET_CATALOG refined by MONITORING_RENDERERS. Free resize is disabled; selecting a legal size reflows neighbors with 240ms size/position transitions. Reduced motion disables animation. Position dragging remains supported. These are Widget rules; placing an ordinary Card in a grid does not apply this catalog.
- A visualizer must declare only sizes for which it has an intentional composition. Overflow and
  scrolling are not substitutes for a legal compact composition.

## Current Widget composition

The accepted eight-category catalog is [Widget monitoring](widget-monitoring.md). `WIDGET_CATALOG` defines semantic capacity; `MONITORING_RENDERERS` refines it for existing renderers; `monitoringSizes` supplies the menu. These are the current Crystra size authorities.

| Renderer | Semantic category | Legal sizes |
| --- | --- | --- |
| numeric-card@1 | value | 1×1 |
| badge@1 | status | 1×1 |
| ratio-bar@1 | progress, linear | 1×1, 1×2, 1×3 |
| table@1 / multiple slices | records | 2×3, 3×3 |

A 1×1 card shows a centered 48px colored object icon with an actual tooltip carrying its full title and coordinate. Primary content remains a readable value or state. True has no redundant check by default. Availability is a green compact marker where needed; badge avoids repeating it. Larger titles use 14px / 20px, weight 400 regardless of language or icons. Details are optional business actions; the preview adapter exposes full MetricPanel data for review, not as a universal widget requirement.

Larger sizes restore only the information appropriate to their category. Tables scroll within their bounded viewport; single-signal cards do not become oversized report cards. Additional chart categories currently have design fixtures, not new production renderers.

## Compatibility boundary

The m×n notation belongs to a Widget, not to the grid container or the monitoring mode. Its border box includes the gaps between spanned cells: columns/rows × 160px + (columns/rows − 1) × 16px. The superseded rule is the simple 160px × multiplier outer size, not the existence of an n×m Widget size. Semantic category and renderer determine the supported size choices independently of this geometry formula.

An ordinary Card arranged in a grid does not acquire Widget sizing or its discrete catalog. `DashboardGrid exactWidgets` opts into the Widget layout contract; callers rendering ordinary panels retain their existing layout constraints. `DashboardComposer monitoring` currently supplies Widgets and selects that contract, but monitoring is not the conceptual boundary. No imported ordinary Card is clamped to Widget sizes. The [existing panel capacity contract](dashboard-legacy-capacity.md) describes the retained ordinary-panel path, not additional Widget sizes. No data contract changes follow from this geometry correction.

## Verification

`tests/browser/library-preview.spec.ts` covers real dimensions, compact icon and tooltip presentation, context-menu sizes, cancellation, and ghost/drop agreement. `components/monitoring-widget.test.tsx` covers the closed category/size catalog and slots. Dark Crystra styling is the accepted scope; light-theme design remains deferred.

## Drag feedback

Widget grid editing hides background grid lines and dashed card outlines. The real card follows the pointer above an empty gray ghost. The ghost uses the same snapping, compaction and centering projection as drop, ignores pointer events, and disappears on release. It must mark the resulting drop position, not the prior position. The dragged card remains fully visible above the ghost.
