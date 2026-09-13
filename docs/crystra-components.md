# Crystra component recipes

Crystra extends the existing React / TypeScript / Tailwind primitives. It does not depend on MUI. The current opt-in dark theme uses the reviewed Task v8 font, color and icon definitions in `design/crystra.tokens.json`. Existing BI theme defaults remain available.

```tsx
import { Card, Button, Icon, IconButton, Typography } from "crystra-ui-core";
import "crystra-ui-core/styles.css";

<div className="wsr-bi" data-crystra-theme="dark">
  <Card
    heading="当前决策状态"
    actions={
      <IconButton aria-label="展开">
        <Icon name="arrow-up-right" />
      </IconButton>
    }
  >
    <Typography variant="body">当前已确认的内容</Typography>
    <Button appearance="outline" tone="warning" size="regular">
      查看影响
    </Button>
  </Card>
</div>;
```

- `appearance`, `tone` and `size` are separate dimensions; defaults live in `src/domain/component-recipes.ts`.
- Button text slots use `startIcon` / `endIcon`. IconButton inherits Button's props and preserves children, native events and refs. Actions default to `type="button"`; form submissions explicitly set `type="submit"`.
- Surface retains `level` and `border`. Card composes heading, description, actions, content and footer, with semantic tone and internal padding presets.
- Chip is presentation-only. StatusBadge keeps its existing business status presets and accepts Chip modifiers.
- Typography accepts the accepted Crystra role names as well as legacy variants. The new role styles activate in the Crystra scope; the HTML element remains independent through `as`.
- Icon uses the local Iconify Tabler subset; the name is type-checked. It does not request external SVGs at runtime.
- Divider supports horizontal and vertical orientation.

Text buttons are 32 / 36 CSS px; icon buttons are 28 / 36px with 14 / 18px icons. Card padding is 12 / 16px, with 12px panel and 8px control radii. These are component recipes derived from v8, not page-layout spacing rules. Entire DSH Input subtrees use `data-host-owned`; generic Crystra recipes exclude them. The host continues to implement messages, Composer, approvals and controls.

The existing Sidebar drawer animation is still controlled by its CSS. The primitive button transition is independent and respects reduced motion; no animation dependency has been introduced. DAG / Workflow layout and motion still follow the Archify reference discipline and domain contracts, not button animation recipes.

## Review and regenerate

Open `/components.html` with the existing Vite development server. The sample uses the actual exported components and supports independent appearance, tone, size and disabled controls.

```sh
node scripts/sync-crystra-design.ts
node scripts/export-crystra-recipes.ts /absolute/output/component-recipes.css
npm exec --workspace crystra-ui-core vite -- build --config vite.components.config.ts
node scripts/export-component-preview.ts /absolute/output/component-preview.html
```

The first command rebuilds theme CSS from the checked-in source snapshot. The recipe export compiles the same Tailwind CSS used by React. The preview export embeds the production JS/CSS bundle for offline review. The library package still exports one external-React bundle; preview bundles do not enter the publishable package.

The first primitive batch is accepted. The second batch is accepted and exports List, ListItem, Tabs and Menu.

- List: size and divided; ListItem: leading / primary / description / metadata / actions, selected. The main entry is a native link (href), button (onActivate), or static content. Actions are siblings: their hover and activation do not trigger the main entry.
- Tabs: controlled value / onValueChange, items, appearance (soft / underline), size. Items have unique stable value, label, panel and optional disabled. Arrow/Home/End move focus; Enter/Space activate. Hidden panels stay mounted. The host maintains a valid value when replacing items. This component owns local panels, not routing.
- Menu: label, items, size and align. Items provide label, icon, tone, disabled and onSelect. Arrow/Home/End skip disabled actions; selection/Escape return focus; Tab/outside pointer dismiss without stealing focus. Placement stays below the trigger, clamps horizontally to the viewport, and scrolls within the available space below; outer scroll/resize dismiss. Mount outside transformed or paint-contained ancestors that change fixed positioning. General Popover and selection/filter forms are separate compositions.

The offline sample supports the shared size selector, tab appearance comparison and independent list actions. Actions report example results without changing backend resources. Task v8 shares tab appearance while retaining its native radio surface controller. Sidebar animation and host Input remain intact.

Selection/filter controls, Popover, empty/skeleton, expanded-list and notification examples are accepted and implemented as the third batch below.

## Fields and state compositions

SearchField and SelectField wrap labeled native controls with compact/regular sizing. SelectField uses the desktop Chromium customizable picker, anchored below the control with upward fallbacks disabled; native values and events remain intact. SelectionControl composes a native checkbox/radio and label. Native value/checked, name, disabled and event props remain controlled by consumers. These are not DSH Input replacements.

Popover provides non-modal form/content interaction, placement below its trigger, outside dismissal, Escape focus return and native Tab exit. As with Menu, avoid ancestors that change the fixed-position containing block. Keep form values in the consumer to retain them across closing.

EmptyState renders a static skeleton and translucent file icon; it is not loading. FullBenchViewer takes title, expanded, onExpandedChange, preview and children. The parent allocates the entire bench height and replaces other bench content when expanded. Preview stays mounted; full content scrolls within the allocated height; returning restores focus. Full-view scroll resets on close.

ProgressNotice is a dismissible bottom-right panel. The caller supplies actual progress and operation text; the sample advances only when explicitly clicked. Closing the notice does not cancel the operation. No timers or backend actions are invented.

Third-batch samples are accepted and available in the offline preview. They do not inject demonstration state into Task v8.

## Geometry source

`design/crystra.geometry.json` separates layout, component spacing, shape, overlay and motion roles. The theme generator consumes it; `node scripts/export-crystra-geometry.ts` exports JSON, CSS and a reference HTML. This extraction preserves accepted numeric values. Layout padding is not inferred from DSH Input. Browser-specific grid/table/context actions remain page compositions.

## Monitoring widget foundation

The accepted monitoring design is the default Library Preview group. `MonitoringWidget` accepts category/size and optional header (title, subtitle, leading, status), content (primary, visualization, supporting), and footer/actions slots. Empty header/footer modules are omitted. The frame is self-contained; no preview wrapper is required. Its styles exclude host-owned subtrees. See [the Widget contract](widget-monitoring.md) for accepted categories, slots, dimensions and integration.

`WIDGET_CATALOG` defines the accepted category/size pairs and rejects unsupported combinations at render time. Border-box dimensions are columns/rows × 160px + (columns/rows − 1) × 16px. It is the design-level capacity catalog, not a replacement for the existing data visualizer registry. The preview uses checked-in illustrative HTML/SVG content; the four registered metric renderers have monitoring adapters; additional professional chart renderers remain unimplemented.

`node scripts/import-widget-monitoring-preview.ts` captures the accepted local static design into `design/widget-monitoring-preview.json` and generates scoped CSS. Runtime imports only checked-in files. Library Preview is built with `CRYSTRA_PREVIEW_ENTRY=library.html` and exported with the shared exporter.

The four BI gallery pages now use `MonitoringMetricPanel`, `DashboardComposer monitoring`, and `CompareResultFrame monitoring`. See [monitoring integration](widget-monitoring.md) for the complete-value inspector and grid contract.
