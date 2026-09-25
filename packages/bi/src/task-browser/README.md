# Task Browser surface

Display and interaction component owned by Crystra-ui. The host provides Task
facts, navigation URLs and callbacks; this component does not access Execution,
Evidence, the filesystem or DSH APIs. Missing metadata remains unknown.

Layout authority: `workflow-self-recursive/tmp/20260907/Crystra-ui-design/pages/task-browser.md`
and its `assets/task-browser.css`. This is a React composition of that design,
not the prototype's imperative resource-browser runtime. CSS was ported from
the accepted design assets. This initial integration is being calibrated at
`http://127.0.0.1:3086/tasks`; it is not yet the accepted production Browser.

Item actions appear at the Gallery card's bottom right and in the List's last
column. Both use the same popup, independent of selection/navigation; Escape
returns focus, arrow/Home/End keys move focus, and outside interaction or host
scroll/resize closes it. Optional owner callbacks expose rename, thumbnail, Pin
and single-item archive; unavailable operations remain visible and disabled.
The header uses the same Button/IconButton/ButtonGroup primitives as Workbench,
with consistent 36px outer geometry. Filters/sort and archive/create form two
joined groups with one container border and internal separators; individual
buttons have no outline. The original shared ToggleSwitch appearance is
preserved. No extra refresh action is added. Gallery metadata has exactly two
rows: title/status above subtitle/item actions, matching the v8 reference.

## Shared-component migration

Browser now composes ResourceBrowserHeader (LayoutHeader), ResourceGalleryCard
(Card full content slot), ResourceTableRow and ButtonGroup's joined variant.
The before/after review artifacts live in `dev/layout/baselines/`. Visual changes
from direct reuse remain pending user acceptance; the earlier screenshots are
still the reference rather than this migration being silently accepted.

## Adaptive filter presentation

Task filtering uses the shared AdaptiveChoice component. ResizeObserver observes
the nearest `data-adaptive-container` (the actual Header), including Sidebar
width changes. At less than 960px of header content width it shows the current
choice as a menu trigger; at or above that width it shows segmented choices.
The threshold is configurable by the composing surface. Both forms use the same
controlled value and action, so resize never clears filters or selection.
The shared ActionMenu provides menu radio state and keyboard navigation.

The same adaptive component now controls sorting (collapse below 1200px),
filtering (960px), and view choice (760px), in that order as the Header narrows.
View choice preserves the existing sliding ToggleSwitch while expanded and uses
a selected-icon menu when compact. Sort remains descending in either form.
Archive uses the danger/error semantic tone without changing archive semantics;
New Task uses primary. The search column shrinks before actions overflow.

Current presentation: all expanded choices show icon + label; compact choices
show only the selected icon, with an accessible name and native tooltip. The
choice surfaces follow ToggleSwitch's neutral inset track, 3px inset and solid
primary selected thumb. View uses this same labelled choice presentation.
Create/archive use shared Button `raised` + `solid` treatment (inner highlight
and lower shadow), with primary/danger tones; archive availability is unchanged.

Toolbar correction: the search surface and unified toolbar share a 40px outside
height. Shared vertical Divider components separate functions; subgroup boxes
and option borders are removed. Compact triggers use stable function icons
(filter, sort-descending, layout-grid), while the selected value remains in the
accessible name, tooltip and menu radio state. Icons never change with selection.
