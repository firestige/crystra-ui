# Crystra UI source handoff

This branch records the reviewed UI implementation and its reproducible review sources. It does not publish a package, change compatibility coordinates, or claim data/Agent integration.

## Accepted reusable surface

Sidebar acceptance follows `components/shell-and-sidebar.md` in the 20260907 v8 source package. Task, Workflow and Analysis titles fill their row; disclosure arrows animate rotation; search replaces every header control. Search, View and All remain independent actions, with a filled play triangle for All. Task view defaults to descending creation time and optionally sorts by effective activity or hides explicitly inactive records. Missing timestamps retain input order and unknown activity remains visible; the host must provide authoritative metadata before these preferences can change ordering or filtering. Workflow view controls name order and version visibility without changing revision identity. Settings is a full-width host callback and does not own a separate settings domain.

- Semantic colors/typography/icons and geometry: `design/crystra.tokens.json`, `design/crystra.geometry.json`; generated opt-in `data-crystra-theme="dark"` styles.
- Card: grayscale surface, rounded corners, low-contrast border and shadow. Widgets own grid-span/size semantics; Card is not implicitly a Widget.
- Button/IconButton/Icon/Tooltip: shared recipes, labels, disabled states and host-input isolation.
- SearchField/ExpandableSearchField: shared layout, focus and expansion; page-owned content passed through slots.
- List/Tabs/selection and ToggleSwitch: shared primitives; crystallization uses the existing round choice switch.
- Dashboard/widget capacity, sizing, chart range and responsive comparison layout: implementation plus unit/browser coverage; preview-specific compositions remain distinct from public exports.

## Review-only sources

Files named `*preview*`, `*study*`, sample JSON, generated workflow geometry and the `preview-host/` DSH adapter are reproducible visual fixtures. They are not exported as production data-backed pages. Archived activity IR 0.1 and earlier layout experiments do not override the current candidate. Comparison-widget variants still marked as pending in their own design docs are not promoted to accepted API merely by retaining their review sources here.

The full source authority, page rules, adoption decisions and v8 artifacts are in Crystra `docs/design/crystra-ui/`. DSH owns the sidebar integration and host input behavior; this library must not import DSH runtime services. Missing semantic variants must be demonstrated in the component preview and reviewed before being applied to pages.

Build with `npm run typecheck`, `npm test`, and `npm run package:verify`. Preview bundles are ignored build output. Workflow layout fixtures require the checked-in candidate generators from the design asset package; no manual coordinate edits.
