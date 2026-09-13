# wsr-ui-core

Host-neutral React components and domain projections for WSR business-intelligence results.

Install the package beside a host-provided React 18 or React 19 runtime. Import `wsr-ui-core/styles.css`, then wrap shared components in `BiSurface`; the stylesheet is scoped to that root and does not install a global reset or theme.

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

`MonitoringWidget` and `WIDGET_CATALOG` provide the accepted eight monitoring categories, optional content slots and 160px grid units with 16px internal gaps in spanning border boxes. Import `wsr-ui-core/styles.css`; no gallery wrapper is required. `Widget` is a deprecated compatibility API. MonitoringMetricPanel provides the four existing result projections; the monitoring Dashboard uses semantic size choices and animated reflow.
