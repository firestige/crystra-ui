import {
  type MonitoringWidgetSize,
  monitoringSizes,
  widgetSpan,
  WIDGET_UNIT,
  WIDGET_GAP,
} from "../domain/widget-catalog";
import { useState, type CSSProperties, type ReactNode } from "react";
import {
  WidgetSizeMenu,
  type WidgetViewOption,
  type WidgetMenuAnchor,
} from "./widget-size-menu";
import ReactGridLayout, {
  useContainerWidth,
  verticalCompactor,
  type Layout,
} from "react-grid-layout";
import { gridBounds, type LayoutConstraint } from "react-grid-layout/core";

import {
  panelSizeForGrid,
  snapDashboardWidgetSize,
  type DashboardLayout,
  type LayoutPanel,
} from "../domain/layout/layout";
import {
  centerDashboardGridItems,
  dashboardGridGeometry,
} from "./dashboard-grid-geometry";
import { IconButton } from "./design-system";

const approvedWidgetSizes: LayoutConstraint = {
  name: "wsr-approved-widget-sizes",
};

function visualizerSizeConstraint(
  visualizer: LayoutPanel["visualizer"],
): LayoutConstraint {
  return {
    ...approvedWidgetSizes,
    constrainSize(_item, w, h) {
      return snapDashboardWidgetSize(visualizer, w, h);
    },
  };
}

function applyGridLayout(
  dashboard: DashboardLayout,
  gridLayout: Layout,
): DashboardLayout {
  const positions = new Map(gridLayout.map((item) => [item.i, item]));
  return {
    ...dashboard,
    panels: dashboard.panels.map((panel) => {
      const item = positions.get(panel.panel_id);
      if (item === undefined) return panel;
      const grid = { x: item.x, y: item.y, w: item.w, h: item.h };
      return { ...panel, grid, size: panelSizeForGrid(grid) };
    }),
  };
}

export function DashboardGrid({
  layout,
  editing = false,
  focusedMetricCoordinate,
  onLayoutChange,
  onRemovePanel,
  renderPanel,
  exactWidgets = false,
  getWidgetSizes,
  getWidgetMinimumSize,
  getWidgetViews,
  canConfigureWidgetRange,
  onConfigureWidgetRange,
}: {
  /** Widget sizing contract; ordinary grid cards retain their own layout constraints. */
  exactWidgets?: boolean;
  getWidgetViews?: (panel: LayoutPanel) => readonly WidgetViewOption[];
  getWidgetSizes?: (panel: LayoutPanel) => readonly MonitoringWidgetSize[];
  getWidgetMinimumSize?: (
    panel: LayoutPanel,
  ) => { h: number; w: number } | undefined;
  canConfigureWidgetRange?: (panel: LayoutPanel) => boolean;
  onConfigureWidgetRange?: (panel: LayoutPanel) => void;
  layout: DashboardLayout;
  editing?: boolean;
  focusedMetricCoordinate?: string;
  onLayoutChange?: (layout: DashboardLayout) => void;
  onRemovePanel?: (panelId: string) => void;
  renderPanel: (panel: LayoutPanel) => ReactNode;
}) {
  const [contextMenu, setContextMenu] = useState<WidgetMenuAnchor | null>(null);
  const menuPanel = layout.panels.find(
    (panel) => panel.panel_id === contextMenu?.panelId,
  );
  const { containerRef, width } = useContainerWidth({ initialWidth: 1200 });
  const visibleColumns = Math.max(
    3,
    Math.floor(
      (Math.max(width, widgetSpan(3)) + WIDGET_GAP) /
        (WIDGET_UNIT + WIDGET_GAP),
    ),
  );
  const columns = Math.max(
    visibleColumns,
    ...layout.panels.map((panel) => panel.grid.w),
  );
  const gridWidth = Math.max(width, widgetSpan(columns));
  const geometry = exactWidgets
    ? {
        width: gridWidth,
        columns,
        columnWidth: WIDGET_UNIT,
        gap: WIDGET_GAP,
        inlinePadding: (gridWidth - widgetSpan(columns)) / 2,
      }
    : dashboardGridGeometry(width);
  const logicalLayout = centerDashboardGridItems(
    layout.panels.map((panel) => ({
      i: panel.panel_id,
      ...panel.grid,
      isDraggable: editing,
      isResizable: editing && !exactWidgets,
      constraints: exactWidgets
        ? []
        : [visualizerSizeConstraint(panel.visualizer)],
    })),
    geometry.columns,
  );
  const gridLayout = logicalLayout;
  const commit = (next: Layout) =>
    onLayoutChange?.(applyGridLayout(layout, next));
  const chooseSize = (panelId: string, value: string) => {
    const [h, w] = value.split("x").map(Number);
    const panel = layout.panels.find((p) => p.panel_id === panelId)!;
    const minimum = getWidgetMinimumSize?.(panel);
    const allowed = minimum
      ? h >= minimum.h && w >= minimum.w
      : (getWidgetSizes?.(panel) ?? monitoringSizes(panel.visualizer)).some(
          (size) => size === value,
        );
    if (!Number.isSafeInteger(h) || !Number.isSafeInteger(w) || !allowed)
      return;
    const next = gridLayout.map((item) =>
      item.i === panelId
        ? {
            ...item,
            w,
            h,
            x: Math.max(0, Math.min(item.x, geometry.columns - w)),
          }
        : item,
    );
    commit(verticalCompactor.compact(next, geometry.columns));
  };

  return (
    <div
      className="dashboard-grid-shell"
      onContextMenuCapture={(event) => {
        if (!editing || !exactWidgets) return;
        const trigger = (event.target as HTMLElement).closest<HTMLElement>(
          ".dashboard-panel",
        );
        if (!trigger?.dataset.panelId) return;
        event.preventDefault();
        event.stopPropagation();
        setContextMenu({
          panelId: trigger.dataset.panelId,
          x: event.clientX,
          y: event.clientY,
          trigger,
        });
      }}
      onKeyDownCapture={(event) => {
        if (
          !editing ||
          !exactWidgets ||
          !(
            event.key === "ContextMenu" ||
            (event.key === "F10" && event.shiftKey)
          )
        )
          return;
        const trigger = (event.target as HTMLElement).closest<HTMLElement>(
          ".dashboard-panel",
        );
        if (!trigger?.dataset.panelId) return;
        event.preventDefault();
        event.stopPropagation();
        const box = trigger.getBoundingClientRect();
        setContextMenu({
          panelId: trigger.dataset.panelId,
          x: box.left + 20,
          y: box.top + 20,
          trigger,
        });
      }}
      data-exact-widgets={exactWidgets ? "true" : undefined}
      data-editing={editing ? "true" : "false"}
      data-grid-columns={geometry.columns}
      data-grid-gap={geometry.gap}
      data-grid-padding={geometry.inlinePadding}
      data-testid="dashboard-grid"
      ref={containerRef}
      style={
        {
          "--dashboard-grid-column-width": `${geometry.columnWidth}px`,
          "--dashboard-grid-gap": `${geometry.gap}px`,
          "--dashboard-grid-inline-padding": `${geometry.inlinePadding}px`,
        } as CSSProperties
      }
    >
      <ReactGridLayout
        className="dashboard-grid"
        constraints={[gridBounds]}
        dragConfig={{
          cancel: ".dashboard-widget-delete, button, a, input, select",
          enabled: editing,
          threshold: 3,
        }}
        gridConfig={{
          cols: geometry.columns,
          containerPadding: [geometry.inlinePadding, 0],
          margin: [geometry.gap, 16],
          rowHeight: 160,
        }}
        layout={gridLayout}
        onDrag={(next, _oldItem, item, placeholder) => {
          if (!exactWidgets || !item || !placeholder) return;
          // RGL seeds its placeholder from the previous position. Project the same
          // compaction and centering that will be applied when the pointer is released.
          const landing = centerDashboardGridItems(
            verticalCompactor.compact(
              next.map((entry) => ({ ...entry })),
              geometry.columns,
            ),
            geometry.columns,
          ).find((entry) => entry.i === item.i);
          if (landing)
            Object.assign(placeholder, {
              x: landing.x,
              y: landing.y,
              w: landing.w,
              h: landing.h,
            });
        }}
        onDragStop={commit}
        onResizeStop={commit}
        resizeConfig={{
          enabled: editing && !exactWidgets,
          handles: editing && !exactWidgets ? ["se"] : [],
        }}
        width={geometry.width}
      >
        {layout.panels.map((panel) => (
          <section
            aria-current={
              focusedMetricCoordinate === panel.metric_coordinate
                ? "true"
                : undefined
            }
            aria-label={`Dashboard widget ${panel.panel_id}`}
            className="dashboard-panel"
            data-grid-height={panel.grid.h}
            data-grid-width={panel.grid.w}
            data-panel-id={panel.panel_id}
            data-size={panel.size}
            data-testid="dashboard-panel"
            key={panel.panel_id}
            tabIndex={editing && exactWidgets ? 0 : undefined}
          >
            {editing && onRemovePanel !== undefined ? (
              <IconButton
                appearance="ghost"
                aria-label={`Delete widget ${panel.panel_id}`}
                className="dashboard-widget-delete"
                data-testid={`dashboard-delete-${panel.panel_id}`}
                disabled={layout.panels.length === 1}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemovePanel(panel.panel_id);
                }}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="dashboard-remove-icon icon-[tabler--x]"
                />
              </IconButton>
            ) : null}
            {renderPanel(panel)}
          </section>
        ))}
      </ReactGridLayout>
      {editing && exactWidgets && contextMenu && menuPanel && (
        <WidgetSizeMenu
          anchor={contextMenu}
          panel={menuPanel}
          sizes={getWidgetSizes?.(menuPanel)}
          minimumSize={getWidgetMinimumSize?.(menuPanel)}
          views={getWidgetViews?.(menuPanel)}
          onConfigureRange={
            onConfigureWidgetRange &&
            (canConfigureWidgetRange?.(menuPanel) ?? true)
              ? () => onConfigureWidgetRange(menuPanel)
              : undefined
          }
          onChoose={(value) => chooseSize(menuPanel.panel_id, value)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
