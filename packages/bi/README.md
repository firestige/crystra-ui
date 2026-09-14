# crystra-ui-core

Host-neutral React components and domain projections for Crystra business-intelligence results.

Install the package beside a host-provided React 18 or React 19 runtime. Import `crystra-ui-core/styles.css`, then wrap shared components in `BiSurface`; the stylesheet is scoped to that root and does not install a global reset or theme.

The package does not own network access, routing, history, authentication, notifications, or application startup. Hosts supply data and action/navigation callbacks through component props and ports.

Dashboard visualizers follow the size-specific information hierarchy and eligibility rules in
[`docs/dashboard-panel-layout.md`](../../docs/dashboard-panel-layout.md).

## Crystra component foundation

The opt-in `data-crystra-theme="dark"` scope supports the reviewed Task visual vocabulary. Reusable additions include Card, Chip, Icon, semantic Typography roles, icon slots, independent tone/size recipes and vertical Divider. See [component recipes](../../docs/crystra-components.md). DSH Input is host-owned and excluded from these recipes.

## Third-party icons

The bundled Iconify Tabler icon subset is distributed under the following license:

```text
MIT License

Copyright (c) 2020-2026 Paweł Kuna

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### MonitoringWidget

`MonitoringWidget` and `WIDGET_CATALOG` provide the accepted eight monitoring categories, optional content slots and 160px grid units with 16px internal gaps in spanning border boxes. Import `crystra-ui-core/styles.css`; no gallery wrapper is required. `Widget` is a deprecated compatibility API. MonitoringMetricPanel provides the four existing result projections; the monitoring Dashboard uses semantic size choices and animated reflow.

### Isolated resource drafts

`WorkflowResourceViewer` defaults to a read-only exact snapshot. A host may provide `onSaveDraft(ResourceDraftSave): Promise<void>` for conditional draft exploration. The request carries the declared resource ID, path, base revision, base content, and edited content. A file-level `revision` takes precedence over the workspace snapshot version. The host must check authority and the exact baseline, persist the draft, and supply the refreshed `workspace` snapshot before resolving. Reject on conflict or failed persistence; the editor retains the local edit and does not claim success. Removing the callback revokes editing, including acceptance of an outstanding save result.

The component never mutates the supplied snapshot or writes package files. Saving a draft does not publish a Workflow, approve a Plan, or authorize execution. Resource creation, deletion, renaming, semantic relation rebuilding, and distribution to an Agent require separate host contracts.
