import { SemanticWidget } from "./semantic-widget";
import {
  FAMILY_FIXTURES,
  familyViews,
  type View,
} from "../domain/widget-families";
import { useState } from "react";
import { DashboardGrid } from "./dashboard-grid";
import { ExpressionWidget } from "./widget-expression-study";
import {
  EXPRESSIONS,
  expressionSizes,
  type Kind,
} from "../domain/widget-expressions";
import type { MonitoringWidgetSize } from "../domain/widget-catalog";
import {
  panelSizeForGrid,
  type DashboardLayout,
} from "../domain/layout/layout";
import { dashboardLayout } from "../test-harness/dashboard-fixture";
import { Button } from "./design-system";
import "../monitoring-bi.css";

// Layout-only fixture adapter. These expressions do not claim metric service bindings.
function initialLayout(): DashboardLayout {
  let x = 0,
    y = 0,
    rowHeight = 1;
  return {
    ...dashboardLayout,
    name: "表达方式 Dashboard",
    panels: EXPRESSIONS.filter((e) => e.id !== "gauge-compact").map((e) => {
      const [h, w] = e.size.split("x").map(Number);
      if (x + w > 8) {
        x = 0;
        y += rowHeight;
        rowHeight = 1;
      }
      const grid = { x, y, w, h };
      x += w;
      rowHeight = Math.max(rowHeight, h);
      return {
        ...dashboardLayout.panels[0],
        panel_id: e.id,
        grid,
        size: panelSizeForGrid(grid),
      };
    }),
  };
}
export function ExpressionDashboard() {
  const [saved, setSaved] = useState(initialLayout);
  const [draft, setDraft] = useState(saved);
  const [editing, setEditing] = useState(false);
  return (
    <section className="expression-dashboard test-dashboard">
      <header className="trace-view-header">
        <div>
          <h2>表达方式 Dashboard</h2>
          <p>模拟数据 · 编辑后拖拽排列，右键选择该表达允许的尺寸</p>
        </div>
        <div className="expression-dashboard-actions">
          {editing ? (
            <>
              <Button
                aria-label="Save dashboard"
                onClick={() => {
                  setSaved(draft);
                  setEditing(false);
                }}
              >
                保存
              </Button>
              <Button
                aria-label="Cancel editing"
                onClick={() => {
                  setDraft(saved);
                  setEditing(false);
                }}
              >
                取消
              </Button>
            </>
          ) : (
            <Button
              aria-label="Edit dashboard"
              onClick={() => {
                setDraft(saved);
                setEditing(true);
              }}
            >
              编辑布局
            </Button>
          )}
        </div>
      </header>
      <DashboardGrid
        exactWidgets
        editing={editing}
        layout={editing ? draft : saved}
        onLayoutChange={editing ? setDraft : undefined}
        getWidgetSizes={(panel) => {
          const fixture = FAMILY_FIXTURES[panel.panel_id];
          return fixture
            ? familyViews(fixture.data).find(
                (v) => v.id === (panel.channels.expressionView ?? fixture.view),
              )!.sizes
            : expressionSizes(panel.panel_id as Kind);
        }}
        getWidgetViews={(panel) => {
          const fixture = FAMILY_FIXTURES[panel.panel_id];
          if (!fixture) return [];
          return familyViews(fixture.data).map((v) => ({
            id: v.id,
            label: v.label,
            selected: v.id === (panel.channels.expressionView ?? fixture.view),
            onChoose: () =>
              setDraft((current) => ({
                ...current,
                panels: current.panels.map((p) => {
                  if (p.panel_id !== panel.panel_id) return p;
                  const oldSize =
                    `${p.grid.h}x${p.grid.w}` as MonitoringWidgetSize;
                  const [h, w] = (
                    v.sizes.includes(oldSize) ? oldSize : v.sizes[0]
                  )
                    .split("x")
                    .map(Number);
                  return {
                    ...p,
                    channels: { ...p.channels, expressionView: v.id },
                    grid: { ...p.grid, w, h },
                    size: panelSizeForGrid({ w, h }),
                  };
                }),
              })),
          }));
        }}
        renderPanel={(panel) => {
          const fixture = FAMILY_FIXTURES[panel.panel_id];
          const size =
            `${panel.grid.h}x${panel.grid.w}` as MonitoringWidgetSize;
          return fixture ? (
            <SemanticWidget
              data={fixture.data}
              view={(panel.channels.expressionView ?? fixture.view) as View}
              size={size}
              exampleId={panel.panel_id}
            />
          ) : (
            <ExpressionWidget id={panel.panel_id as Kind} size={size} />
          );
        }}
      />
    </section>
  );
}
