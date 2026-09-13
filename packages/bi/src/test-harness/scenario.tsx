import { useState } from "react";

import { DashboardComposer } from "../components/dashboard-composer";
import type { DashboardLayout } from "../domain/layout/layout";
import { Typography } from "../public";

import { dashboardLayout, dashboardResults } from "./dashboard-fixture";

export function ActiveScenario({
  monitoring = false,
}: {
  monitoring?: boolean;
}) {
  const [layout, setLayout] = useState<DashboardLayout>(() =>
    monitoring
      ? {
          ...dashboardLayout,
          panels: dashboardLayout.panels.map((panel) => ({
            ...panel,
            grid: {
              ...panel.grid,
              ...({
                rework: { x: 0, y: 0 },
                "role-model-outcome": { x: 2, y: 0 },
                latency: { x: 3, y: 0 },
                "terminal-outcome": { x: 4, y: 0 },
              }[panel.panel_id] ??
                (panel.metric_coordinate.startsWith("delivery-stage")
                  ? { x: 0, y: 1 }
                  : { x: 3, y: 1 })),
            },
          })),
        }
      : dashboardLayout,
  );
  return (
    <DashboardComposer
      monitoring={monitoring}
      layout={layout}
      onApply={setLayout}
      results={dashboardResults}
    >
      {({ actions, dashboard }) => (
        <section
          aria-label="Dashboard inspection"
          className="test-dashboard"
          data-testid="dashboard-scenario"
        >
          <header className="test-dashboard__intro trace-view-header">
            <div className="trace-view-header-copy">
              <Typography variant="overline" weight="bold">
                Exact recorded metrics
              </Typography>
              <Typography as="h2" variant="h2">
                Agent Operations Dashboard
              </Typography>
              <Typography as="p" tone="muted" variant="caption">
                Persistent fixture covering dashboard sizes and visualizers.
              </Typography>
            </div>
            <div aria-hidden="true" className="trace-view-header-spacer" />
            <div className="test-dashboard__actions">{actions}</div>
          </header>
          {dashboard}
        </section>
      )}
    </DashboardComposer>
  );
}
