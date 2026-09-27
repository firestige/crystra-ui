import { observeElementWidth } from "./observe-element-width";
import { useLayoutEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import {
  Button,
  ButtonGroup,
  Divider,
  Chip,
  IconButton,
} from "./design-system";
import { Menu } from "./collection-components";
import { Icon, type IconName } from "./icon";
import { WidgetTooltip } from "./widget-tooltip";
export interface WorkflowMapToolbarProps {
  status?: { label: string };
  scale: number;
  pathMode: "expected" | "all";
  direction: "RIGHT" | "DOWN";
  canFocus: boolean;
  issueCount: number;
  actions?: ReactNode;
  onZoom: (value: number | null) => void;
  onFocus: () => void;
  onFit: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onPath: (value: "expected" | "all") => void;
  onDirection: (value: "RIGHT" | "DOWN") => void;
  onIssues: () => void;
}
/** Controlled map commands; density follows the allocated header slot, not device names. */
export function WorkflowMapToolbar(p: WorkflowMapToolbarProps) {
  const [width, setWidth] = useState(0);
  const root = useRef<HTMLDivElement>(null),
    restoreFocus = useRef(false);
  useLayoutEffect(() => {
    if (!root.current) return;
    return observeElementWidth(root.current, (width) => {
      restoreFocus.current =
        root.current?.contains(document.activeElement) ?? false;
      setWidth(width);
    });
  }, []);
  const full = width >= 760,
    compact = width < 460;
  useLayoutEffect(() => {
    if (restoreFocus.current) {
      root.current
        ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
        ?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [full, compact]);
  const command = (
    label: string,
    icon: IconName,
    action: () => void,
    disabled = false,
  ) => (
    <WidgetTooltip
      text={label}
      focusable={disabled}
      className="map-action-tooltip"
    >
      <IconButton
        appearance="ghost"
        aria-label={label}
        disabled={disabled}
        onClick={action}
      >
        <Icon name={icon} />
      </IconButton>
    </WidgetTooltip>
  );
  const menu = (
    label: string,
    icon: IconName,
    items: React.ComponentProps<typeof Menu>["items"],
    text = false,
  ) => (
    <Menu
      label={label}
      icon={<Icon name={icon} />}
      iconOnly={!text}
      items={items}
    />
  );
  const check = (selected: boolean) =>
    selected ? <Icon name="check" /> : undefined;
  const viewItems = [
    {
      id: "out",
      label: "缩小",
      onSelect: () => p.onZoom(Math.max(0.1, p.scale * 0.8)),
    },
    {
      id: "reset",
      label: `恢复 100%（当前 ${Math.round(p.scale * 100)}%）`,
      onSelect: () => p.onZoom(1),
    },
    {
      id: "in",
      label: "放大",
      onSelect: () => p.onZoom(Math.min(2, p.scale * 1.25)),
    },
    {
      id: "focus",
      label: "返回焦点",
      disabled: !p.canFocus,
      onSelect: p.onFocus,
    },
    { id: "fit", label: "适应当前层", onSelect: p.onFit },
    { id: "overview", label: "全图概览", onSelect: () => p.onZoom(null) },
  ];
  const pathItems = [
    {
      id: "expected",
      label: "路径 · 预期路径",
      icon: check(p.pathMode === "expected"),
      onSelect: () => p.onPath("expected"),
    },
    {
      id: "all",
      label: "路径 · 全部路径",
      icon: check(p.pathMode === "all"),
      onSelect: () => p.onPath("all"),
    },
  ];
  const directionItems = [
    {
      id: "right",
      label: "布局 · 横向",
      icon: check(p.direction === "RIGHT"),
      onSelect: () => p.onDirection("RIGHT"),
    },
    {
      id: "down",
      label: "布局 · 纵向",
      icon: check(p.direction === "DOWN"),
      onSelect: () => p.onDirection("DOWN"),
    },
  ];
  const expansion = [
    { id: "collapse", label: "层级 · 折叠全部", onSelect: p.onCollapse },
    { id: "expand", label: "层级 · 展开全部", onSelect: p.onExpand },
  ];
  return (
    <div
      ref={root}
      className="map-header-actions crystra-bi"
      data-crystra-theme="dark"
      data-ui-owner="components"
      data-density={full ? "full" : compact ? "compact" : "medium"}
    >
      <ButtonGroup className="map-command-group">
        {compact ? (
          menu("视图", "search", viewItems)
        ) : (
          <>
            {command("缩小活动图", "minus", () =>
              p.onZoom(Math.max(0.1, p.scale * 0.8)),
            )}
            <Button
              appearance="ghost"
              title="恢复 100% 缩放"
              aria-label="恢复 100% 缩放"
              onClick={() => p.onZoom(1)}
            >
              {Math.round(p.scale * 100)}%
            </Button>
            {command("放大活动图", "plus", () =>
              p.onZoom(Math.min(2, p.scale * 1.25)),
            )}
            {full ? (
              <>
                {command("返回焦点", "target", p.onFocus, !p.canFocus)}
                {command("适应当前层", "square", p.onFit)}
                {command("全图概览", "chart-dots", () => p.onZoom(null))}
              </>
            ) : (
              menu("视图", "search", viewItems.slice(3))
            )}
          </>
        )}
      </ButtonGroup>
      <Divider orientation="vertical" />
      <ButtonGroup className="map-command-group">
        {full ? (
          <>
            {command("折叠全部", "layout-sidebar-left-collapse", p.onCollapse)}
            {command("展开全部", "layout-sidebar-left-expand", p.onExpand)}
            {menu("路径视角", "git-branch", pathItems, true)}
            {menu("布局方向", "layout-columns", directionItems, true)}
          </>
        ) : (
          menu("显示", "adjustments-horizontal", [
            ...pathItems,
            ...directionItems,
            ...expansion,
          ])
        )}
      </ButtonGroup>
      <Divider orientation="vertical" />
      <ButtonGroup className="map-command-group">
        {full && p.status && <Chip>{p.status.label}</Chip>}
        <WidgetTooltip
          text={`${p.status ? p.status.label + " · " : ""}${p.issueCount ? p.issueCount + " 项待检查" : "检查"}`}
          className="map-action-tooltip"
        >
          <Button
            appearance="ghost"
            aria-label={p.issueCount ? p.issueCount + " 项待检查" : "检查"}
            onClick={p.onIssues}
          >
            <Icon name={p.issueCount ? "exclamation-circle" : "circle-check"} />
            {full ? (
              p.issueCount ? (
                p.issueCount + " 项待检查"
              ) : (
                "检查"
              )
            ) : p.issueCount > 0 ? (
              <span className="map-issues-count">{p.issueCount}</span>
            ) : null}
          </Button>
        </WidgetTooltip>
        {p.actions}
      </ButtonGroup>
    </div>
  );
}
