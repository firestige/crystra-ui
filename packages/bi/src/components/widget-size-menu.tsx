import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  type MonitoringWidgetSize,
  monitoringSizes,
} from "../domain/widget-catalog";
import type { LayoutPanel } from "../domain/layout/layout";
import { Icon } from "./icon";

export interface WidgetViewOption {
  id: string;
  label: string;
  selected: boolean;
  onChoose: () => void;
}
export interface WidgetMenuAnchor {
  panelId: string;
  x: number;
  y: number;
  trigger: HTMLElement;
}
export function WidgetSizeMenu({
  anchor,
  panel,
  onChoose,
  onClose,
  sizes: allowedSizes,
  views,
  minimumSize,
  onConfigureRange,
}: {
  sizes?: readonly MonitoringWidgetSize[];
  views?: readonly WidgetViewOption[];
  minimumSize?: { h: number; w: number };
  anchor: WidgetMenuAnchor;
  panel: LayoutPanel;
  onChoose: (size: string) => void;
  onConfigureRange?: () => void;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [custom, setCustom] = useState(false);
  const [rows, setRows] = useState(String(panel.grid.h));
  const [columns, setColumns] = useState(String(panel.grid.w));
  const sizes = allowedSizes ?? monitoringSizes(panel.visualizer);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    el.style.left = `${Math.max(8, Math.min(anchor.x, window.innerWidth - box.width - 8))}px`;
    el.style.top = `${Math.max(8, Math.min(anchor.y, window.innerHeight - box.height - 8))}px`;
    el.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus({
      preventScroll: true,
    });
  }, [anchor, custom]);
  useEffect(() => {
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) onClose();
    };
    const dismiss = () => onClose();
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", dismiss);
    window.addEventListener("wheel", dismiss, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("wheel", dismiss, true);
    };
  }, [onClose]);
  const closeWithFocus = () => {
    onClose();
    anchor.trigger.focus({ preventScroll: true });
  };
  return createPortal(
    <div className="wsr-bi" data-crystra-theme="dark">
      <div
        ref={root}
        role="menu"
        aria-label={`Widget size ${panel.panel_id}`}
        className="wsr-menu-panel dashboard-size-menu"
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Escape" || e.key === "Tab") {
            e.preventDefault();
            e.stopPropagation();
            closeWithFocus();
            return;
          }
          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
          e.preventDefault();
          const items = Array.from(
            root.current!.querySelectorAll<HTMLButtonElement>(
              '[role="menuitemradio"]',
            ),
          );
          const index = items.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          const next =
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? items.length - 1
                : (index + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
                  items.length;
          items[next]?.focus({ preventScroll: true });
        }}
      >
        {views && views.length > 1 && (
          <>
            <div className="dashboard-size-menu-heading">表达方式</div>
            {views.map((view) => (
              <button
                key={view.id}
                type="button"
                role="menuitemradio"
                aria-checked={view.selected}
                className="wsr-menu-item"
                onClick={() => {
                  view.onChoose();
                  closeWithFocus();
                }}
              >
                <span className="dashboard-size-menu-mark">
                  {view.selected && <Icon name="check" />}
                </span>
                {view.label}
              </button>
            ))}
          </>
        )}
        <div className="dashboard-size-menu-heading">更改大小</div>
        {sizes.map((size) => (
          <button
            type="button"
            role="menuitemradio"
            aria-checked={size === `${panel.grid.h}x${panel.grid.w}`}
            key={size}
            className="wsr-menu-item"
            onClick={() => {
              onChoose(size);
              closeWithFocus();
            }}
          >
            <span className="dashboard-size-menu-mark">
              {size === `${panel.grid.h}x${panel.grid.w}` && (
                <Icon name="check" />
              )}
            </span>
            {size.replace("x", "×")}
          </button>
        ))}
        {minimumSize && (
          <>
            <button
              type="button"
              role="menuitem"
              className="wsr-menu-item"
              aria-expanded={custom}
              onClick={() => setCustom((value) => !value)}
            >
              <span className="dashboard-size-menu-mark" />
              自定义尺寸…
            </button>
            {custom && (
              <div
                className="dashboard-custom-size"
                role="group"
                aria-label="自定义尺寸"
              >
                <label>
                  行
                  <input
                    aria-label="自定义行数"
                    type="number"
                    min={minimumSize.h}
                    step="1"
                    value={rows}
                    onChange={(event) => setRows(event.target.value)}
                  />
                </label>
                <label>
                  列
                  <input
                    aria-label="自定义列数"
                    type="number"
                    min={minimumSize.w}
                    step="1"
                    value={columns}
                    onChange={(event) => setColumns(event.target.value)}
                  />
                </label>
                <small>
                  最小 {minimumSize.h}×{minimumSize.w}，无上限
                </small>
                <button
                  type="button"
                  disabled={
                    !Number.isSafeInteger(Number(rows)) ||
                    !Number.isSafeInteger(Number(columns)) ||
                    Number(rows) < minimumSize.h ||
                    Number(columns) < minimumSize.w
                  }
                  onClick={() => {
                    onChoose(`${Number(rows)}x${Number(columns)}`);
                    closeWithFocus();
                  }}
                >
                  应用尺寸
                </button>
              </div>
            )}
          </>
        )}
        {onConfigureRange && (
          <>
            <div className="dashboard-size-menu-heading">图表配置</div>
            <button
              type="button"
              role="menuitem"
              className="wsr-menu-item"
              onClick={() => {
                onConfigureRange();
                onClose();
              }}
            >
              <span className="dashboard-size-menu-mark" />
              数值范围…
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
