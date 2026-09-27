import { WorkflowMapToolbar } from "./workflow-map-toolbar";
import { WorkflowMapNodeGlyph } from "./workflow-map-node-glyph";
import { useLayoutEffect } from "react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Card, IconButton, Typography } from "./design-system";
import { SearchField } from "./state-components";
import { Icon } from "./icon";
import {
  parseWorkflowMap,
  projectWorkflowMap,
  mapAncestors,
  type WorkflowMapIR,
} from "../domain/workflow-map-ir";
import {
  layoutWorkflowMap,
  type MapLayout,
} from "../domain/workflow-map-engine";
import { frameMap, upstreamMap } from "../domain/workflow-map-camera";
import { useWorkflowMapViewport } from "./use-workflow-map-viewport";
import {
  WorkflowMapOutline,
  WorkflowMapMinimap,
} from "./workflow-map-navigation";
import { WidgetTooltip } from "./widget-tooltip";
import mapTokens from "../../../../design/workflow-map.tokens.json";
import "../workflow-map-workbench.css";
export type WorkflowLayoutResolver = (
  ir: WorkflowMapIR,
  expanded: ReadonlySet<string>,
  direction: "RIGHT" | "DOWN",
  bounds?: { width: number; height: number },
) => Promise<MapLayout>;
export interface WorkflowMapWorkbenchProps {
  workflow: WorkflowMapIR;
  mode: string;
  headerContainer: HTMLElement | null;
  onQuote: (text: string) => void;
  layoutResolver?: WorkflowLayoutResolver;
  actions?: ReactNode;
  status?: { label: string };
  crystallization?: ReactNode;
  requestedNode?: { id: string; seq: number } | null;
}
const kindName = {
  start: "起点",
  end: "完成",
  activity: "活动",
  decision: "判断",
  fork: "并行",
  join: "汇合",
  group: "复合活动",
};
function MapIconButton(props: React.ComponentProps<typeof IconButton>) {
  return (
    <WidgetTooltip
      text={String(props["aria-label"] || "")}
      focusable={!!props.disabled}
      className="map-action-tooltip"
    >
      <IconButton {...props} />
    </WidgetTooltip>
  );
}
export function WorkflowMapWorkbench({
  workflow: currentIR,
  mode,
  headerContainer: headerHost,
  onQuote: quote,
  layoutResolver: previewLayout = layoutWorkflowMap,
  actions,
  status,
  crystallization,
  requestedNode,
}: WorkflowMapWorkbenchProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [layout, setLayout] = useState<MapLayout | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [focus, setFocus] = useState(false),
    [pathMode, setPathMode] = useState<"expected" | "all">("expected"),
    [outlineOpen, setOutlineOpen] = useState(false);
  const [direction, setDirection] = useState<"RIGHT" | "DOWN">("RIGHT"),
    [query, setQuery] = useState(""),
    [scope, updateScope] = useState<string | null>(null),
    [focalId, setFocalId] = useState<string | null>(null),
    [cameraRevision, setCameraRevision] = useState(0),
    [bounds, setBounds] = useState({ width: 1000, height: 700 });
  const [panel, setPanel] = useState<"detail" | "issues" | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const focalView = useRef<{ id: string; expanded: Set<string> } | null>(null);
  const [isolate, setIsolate] = useState(false);
  const { camera, moving, move } = useWorkflowMapViewport(viewport, () =>
    setIsolate(false),
  );
  const moveRef = useRef(move);
  useLayoutEffect(() => {
    moveRef.current = move;
  });
  const setScope = (id: string | null) => {
    updateScope(id);
    if (id) setFocalId(id);
  };
  const parsed = useMemo(() => parseWorkflowMap(currentIR), [currentIR]);
  const issues = parsed.ok ? parsed.issues : parsed.errors;
  const projected = useMemo(
    () => projectWorkflowMap(currentIR, expanded),
    [currentIR, expanded],
  );
  const byId = useMemo(
    () => new Map(currentIR.nodes.map((n) => [n.id, n])),
    [currentIR],
  );
  const current = selected ? byId.get(selected) : undefined;
  const currentEdge = currentIR.edges.find((e) => e.id === selected);
  const breadcrumbNode = current || (scope ? byId.get(scope) : undefined);
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start an asynchronous engine request; pending status belongs to that external lifecycle.
    setBusy(true);
    setError("");
    previewLayout(currentIR, expanded, direction, bounds)
      .then((next) => {
        if (cancelled) return;
        setLayout(next);
        setBusy(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError("布局暂未完成：" + e.message);
        setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentIR, expanded, direction, bounds, previewLayout]);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const obs = new ResizeObserver(
      () =>
        element.clientWidth > 0 &&
        element.clientHeight > 0 &&
        setBounds({ width: element.clientWidth, height: element.clientHeight }),
    );
    obs.observe(element);
    return () => obs.disconnect();
  }, []);
  const scale = camera.scale;
  const setZoom = (value: number | null) => {
    if (value === null) {
      setScope(null);
      setCameraRevision((v) => v + 1);
      return;
    }
    const ratio = value / camera.scale;
    move({
      scale: value,
      x: bounds.width / 2 - (bounds.width / 2 - camera.x) * ratio,
      y: bounds.height / 2 - (bounds.height / 2 - camera.y) * ratio,
    });
  };
  useEffect(() => {
    if (!layout || busy) return;
    const target = scope ? layout.nodes.find((n) => n.id === scope) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- A completed engine layout starts a new camera focus; manual D3 exploration may release it afterward.
    setIsolate(!!target?.expanded);
    if (target && scope)
      focalView.current = { id: scope, expanded: new Set(expanded) };
    let frame = target
      ? { x: target.x, y: target.y, width: target.width, height: target.height }
      : { x: 0, y: 0, width: layout.width, height: layout.height };
    if (target && layout.boundaries) {
      let left = frame.x,
        top = frame.y,
        right = left + frame.width,
        bottom = top + frame.height;
      const measure = document.createElement("canvas").getContext("2d");
      if (measure) measure.font = "14px system-ui";
      for (const b of layout.boundaries.filter((b) => b.group === scope)) {
        const label =
          (b.direction === "in" ? "来自 " : "前往 ") +
          (byId.get(b.external)?.title || "");
        const w = (measure?.measureText(label).width || label.length * 14) + 16;
        left = Math.min(
          left,
          b.x - (b.side === "WEST" ? w + 12 : b.side === "EAST" ? 0 : w / 2),
        );
        right = Math.max(
          right,
          b.x + (b.side === "EAST" ? w + 12 : b.side === "WEST" ? 0 : w / 2),
        );
        top = Math.min(top, b.y - 34);
        bottom = Math.max(bottom, b.y + 34);
      }
      frame = { x: left, y: top, width: right - left, height: bottom - top };
    }
    moveRef.current(frameMap(frame, bounds));
  }, [layout, busy, bounds, scope, cameraRevision, byId, expanded]);
  const inScope = (id: string) =>
    !isolate ||
    !scope ||
    id === scope ||
    mapAncestors(currentIR, id).includes(scope);
  const related = useMemo(() => {
    if (!selected) return new Set<string>();
    const target = currentEdge?.to || selected;
    const upstream = upstreamMap(currentIR, target, pathMode),
      ids = new Set<string>(upstream.nodes);
    for (const id of upstream.nodes)
      for (const ancestor of mapAncestors(currentIR, id)) ids.add(ancestor);
    for (const edge of projected.edges)
      if (upstream.edges.has(edge.id)) {
        ids.add(edge.id);
        ids.add(edge.from);
        ids.add(edge.to);
      }
    return ids;
  }, [selected, currentEdge, projected, currentIR, pathMode]);
  const expectedNodes = useMemo(() => {
    const ids = new Set<string>();
    for (const e of currentIR.edges)
      if (e.kind !== "material" && (!e.intent || e.intent === "expected")) {
        ids.add(e.from);
        ids.add(e.to);
      }
    for (const id of [...ids])
      for (const ancestor of mapAncestors(currentIR, id)) ids.add(ancestor);
    return ids;
  }, [currentIR]);
  const nodeOpacity = (id: string) =>
    focus
      ? related.has(id)
        ? 1
        : 0.2
      : pathMode === "expected" && !expectedNodes.has(id)
        ? 0.65
        : 1;
  const edgeOpacity = (id: string) => {
    const e = currentIR.edges.find((e) => e.id === id);
    return focus
      ? related.has(id)
        ? 1
        : 0.15
      : pathMode === "expected" && e?.intent && e.intent !== "expected"
        ? 0.6
        : 1;
  };
  const locate = (id: string) => {
    setExpanded((e) => new Set([...e, ...mapAncestors(currentIR, id)]));
    setSelected(id);
    setFocus(true);
    setPanel("detail");
    setQuery("");
    setFocus(true);
    setScope(id);
    setCameraRevision((v) => v + 1);
  };
  useEffect(() => {
    if (!requestedNode) return;
    const id = requestedNode.id;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Consume a navigation request from the host resource view and synchronize the canvas selection.
    setExpanded((e) => new Set([...e, ...mapAncestors(currentIR, id)]));
    setSelected(id);
    setFocus(true);
    setPanel("detail");
    setQuery("");
    updateScope(id);
    setFocalId(id);
    setCameraRevision((v) => v + 1);
  }, [requestedNode, currentIR]);
  const toggle = (id: string) => {
    const closing = expanded.has(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (closing) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelected(null);
    setFocus(false);
    setPanel(null);
    setScope(closing ? byId.get(id)?.parent || null : id);
    setCameraRevision((v) => v + 1);
  };
  const selectNode = (id: string) => {
    setSelected(id);
    setFocus(true);
    setPanel("detail");
    setScope(id);
    setCameraRevision((v) => v + 1);
  };
  const leaveScope = () => {
    if (!scope) return;
    if (expanded.has(scope)) {
      toggle(scope);
      return;
    }
    setSelected(null);
    setPanel(null);
    setFocus(false);
    setScope(byId.get(scope)?.parent || null);
    setCameraRevision((v) => v + 1);
  };
  const nodeIssues = (id: string) =>
    issues.filter(
      (i) =>
        i.nodeId === id ||
        (i.nodeId && mapAncestors(currentIR, i.nodeId).includes(id)),
    );
  const keyboard = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (byId.has(id)) selectNode(id);
      else {
        setSelected(id);
        setFocus(true);
        setPanel("detail");
      }
    }
  };
  return (
    <div
      className="map-workbench"
      data-crystallization={mode === "crystallization"}
      style={mapTokens.dark as React.CSSProperties}
      data-ui-owner="components"
      data-section-id="workflow-map-workbench"
    >
      {headerHost &&
        mode !== "resources" &&
        mode !== "crystallization" &&
        createPortal(
          <WorkflowMapToolbar
            status={status}
            scale={scale}
            pathMode={pathMode}
            direction={direction}
            canFocus={!!focalId}
            issueCount={issues.length}
            actions={actions}
            onZoom={setZoom}
            onFit={() => setCameraRevision((v) => v + 1)}
            onFocus={() => {
              if (focalId) {
                if (focalView.current)
                  setExpanded(new Set(focalView.current.expanded));
                setScope(focalId);
                setCameraRevision((v) => v + 1);
              }
            }}
            onCollapse={() => {
              setExpanded(new Set());
              setZoom(null);
            }}
            onExpand={() => {
              setExpanded(
                new Set(
                  currentIR.nodes
                    .filter((n) => n.kind === "group")
                    .map((n) => n.id),
                ),
              );
              setZoom(null);
            }}
            onPath={setPathMode}
            onDirection={(value) => {
              setDirection(value);
              setZoom(null);
            }}
            onIssues={() => setPanel(panel === "issues" ? null : "issues")}
          />,
          headerHost,
        )}
      {mode === "crystallization" && crystallization}
      <div className="map-viewbar">
        <div>
          <MapIconButton
            appearance="ghost"
            aria-label={outlineOpen ? "隐藏活动大纲" : "显示活动大纲"}
            aria-expanded={outlineOpen}
            onClick={() => setOutlineOpen((v) => !v)}
          >
            <Icon
              name={
                outlineOpen
                  ? "layout-sidebar-left-collapse"
                  : "layout-sidebar-left-expand"
              }
            />
          </MapIconButton>
          <Button appearance="ghost" disabled={!scope} onClick={leaveScope}>
            返回上层
          </Button>
          <Button
            appearance="ghost"
            onClick={() => {
              setFocus(false);
              setSelected(null);
              setPanel(null);
              setZoom(null);
            }}
          >
            整个工作流
          </Button>
          {breadcrumbNode && (
            <>
              <Icon
                name="chevron-down"
                style={{ transform: "rotate(-90deg)" }}
              />
              {[
                ...mapAncestors(currentIR, breadcrumbNode.id),
                breadcrumbNode.id,
              ].map((id) => (
                <Button
                  key={id}
                  appearance="ghost"
                  onClick={() => {
                    setScope(id);
                    setCameraRevision((v) => v + 1);
                  }}
                >
                  {byId.get(id)!.title}
                </Button>
              ))}
            </>
          )}
        </div>
        <div className="map-search">
          <SearchField
            label="查找活动、材料或资源"
            hideLabel
            leading={<Icon name="search" />}
            placeholder="查找活动、材料或资源"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {query && (
          <div className="map-search-results">
            {currentIR.nodes
              .filter((n) =>
                [
                  n.title,
                  n.description,
                  ...(n.inputs || []),
                  ...(n.outputs || []),
                  ...(n.resources || []),
                ]
                  .join(" ")
                  .includes(query),
              )
              .map((n) => (
                <Button
                  key={n.id}
                  appearance="ghost"
                  onClick={() => locate(n.id)}
                >
                  {n.title}
                  <Typography variant="meta" tone="muted">
                    {mapAncestors(currentIR, n.id)
                      .map((id) => byId.get(id)!.title)
                      .join(" / ") || "顶层"}
                  </Typography>
                </Button>
              ))}
            {!currentIR.nodes.some((n) =>
              [
                n.title,
                n.description,
                ...(n.inputs || []),
                ...(n.outputs || []),
                ...(n.resources || []),
              ]
                .join(" ")
                .includes(query),
            ) && (
              <Typography variant="description">没有找到匹配活动</Typography>
            )}
          </div>
        )}
      </div>
      {mode === "crystallization" && (
        <div className="map-evidence-hint">
          <Typography variant="meta" tone="muted">
            选择活动，围绕材料、资源和重复工作继续研究；尚未绑定执行证据。
          </Typography>
        </div>
      )}
      <div className="map-stage">
        <div
          className="map-outline-rail"
          data-open={outlineOpen}
          inert={!outlineOpen}
        >
          <div>
            <WorkflowMapOutline
              ir={currentIR}
              selected={selected || scope}
              onLocate={(id) => {
                locate(id);
                if (byId.get(id)?.kind === "group")
                  setExpanded((prev) => new Set([...prev, id]));
              }}
            />
          </div>
        </div>
        <div className="map-canvas-area">
          <div
            className="map-viewport"
            ref={viewport}
            aria-label="活动图画布"
            aria-busy={busy}
            data-camera-moving={moving}
          >
            {layout && (
              <svg
                width="100%"
                height="100%"
                role="group"
                aria-label="工作流活动图"
              >
                <defs>
                  <marker
                    id="map-arrow"
                    markerUnits="userSpaceOnUse"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="4"
                    orient="auto"
                    viewBox="0 0 8 8"
                  >
                    <path d="M0 0L8 4L0 8Z" fill="context-stroke" />
                  </marker>
                </defs>
                <g
                  className="map-camera"
                  data-camera-scope={scope || "$root"}
                  style={{
                    transform: `translate(${camera.x}px, ${camera.y}px) scale(${scale})`,
                  }}
                >
                  {layout.nodes
                    .filter((n) => n.expanded)
                    .map((n) => (
                      <g
                        key={n.id}
                        className="map-group"
                        data-out-of-scope={!inScope(n.id)}
                        opacity={nodeOpacity(n.id)}
                      >
                        <rect
                          x={n.x}
                          y={n.y}
                          width={n.width}
                          height={n.height}
                          rx="14"
                        />
                        <text
                          x={n.x + 18}
                          y={n.y + 30}
                          onClick={() => selectNode(n.id)}
                        >
                          {byId.get(n.id)?.title}
                        </text>
                        <g
                          role="button"
                          tabIndex={0}
                          aria-label={"收起 " + byId.get(n.id)?.title}
                          onClick={() => toggle(n.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggle(n.id);
                            }
                          }}
                          className="map-disclosure"
                        >
                          <rect
                            x={n.x + n.width - 38}
                            y={n.y + 10}
                            width="28"
                            height="28"
                            rx="6"
                          />
                          <path
                            d={`M${n.x + n.width - 30} ${n.y + 26}l6 -6l6 6`}
                          />
                        </g>
                      </g>
                    ))}
                  {layout.edges.map((e) => {
                    const semantic = projected.edges.find((x) => x.id === e.id);
                    return (
                      <g
                        key={e.segmentKey || e.id}
                        className={
                          "map-edge " +
                          (semantic?.kind === "material" ? "material" : "")
                        }
                        data-out-of-scope={
                          e.segmentKey
                            ? !!(
                                isolate &&
                                scope &&
                                (!e.scope || !inScope(e.scope))
                              )
                            : !!semantic &&
                              (!inScope(semantic.from) || !inScope(semantic.to))
                        }
                        data-intent={semantic?.intent || "unclassified"}
                        data-upstream={focus && related.has(e.id)}
                        data-selected={selected === e.id}
                        opacity={edgeOpacity(e.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={
                          "关系：" +
                          (semantic?.label ||
                            byId.get(semantic?.originalFrom || "")?.title +
                              " → " +
                              byId.get(semantic?.originalTo || "")?.title)
                        }
                        onClick={() => {
                          setSelected(e.id);
                          setFocus(true);
                          setPanel("detail");
                        }}
                        onKeyDown={(event) => keyboard(event, e.id)}
                      >
                        <path
                          d={e.path}
                          markerEnd={
                            e.arrow === false ? undefined : "url(#map-arrow)"
                          }
                        />
                        <path className="map-edge-hit" d={e.path} />
                        {e.label && (
                          <g>
                            <rect
                              x={e.label.x - 4}
                              y={e.label.y - 2}
                              width={e.label.width + 8}
                              height={e.label.height + 4}
                              rx="4"
                            />
                            <text x={e.label.x + 4} y={e.label.y + 17}>
                              {e.label.text.split("\n").map((line, i) => (
                                <tspan
                                  key={i}
                                  x={e.label!.x + 4}
                                  dy={i ? 20 : 0}
                                >
                                  {line}
                                </tspan>
                              ))}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                  {(layout.boundaries || [])
                    .filter((b) => !isolate || !scope || inScope(b.group))
                    .map((b) => (
                      <g
                        key={b.id}
                        className="map-boundary"
                        style={{
                          color: `var(--workflow-flow-${currentIR.edges.find((e) => e.id === b.edgeId)?.intent || "unclassified"})`,
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={
                          (b.direction === "in" ? "输入来自 " : "输出前往 ") +
                          byId.get(b.external)?.title
                        }
                        onClick={() => {
                          setSelected(b.edgeId);
                          setPanel("detail");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setSelected(b.edgeId);
                            setPanel("detail");
                          }
                        }}
                      >
                        <circle cx={b.x} cy={b.y} r="5" fill="currentColor" />
                        <title>
                          {byId.get(b.external)?.title} ·{" "}
                          {byId.get(b.target)?.title}
                        </title>
                        {scope === b.group && (
                          <text
                            x={
                              b.x +
                              (b.side === "WEST"
                                ? -12
                                : b.side === "EAST"
                                  ? 12
                                  : 0)
                            }
                            y={
                              b.y +
                              (b.side === "NORTH"
                                ? -14
                                : b.side === "SOUTH"
                                  ? 24
                                  : 5)
                            }
                            textAnchor={
                              b.side === "WEST"
                                ? "end"
                                : b.side === "EAST"
                                  ? "start"
                                  : "middle"
                            }
                            fill="currentColor"
                            fontSize="14"
                          >
                            {b.direction === "in" ? "来自 " : "前往 "}
                            {byId.get(b.external)?.title}
                          </text>
                        )}
                      </g>
                    ))}
                  {layout.nodes
                    .filter((n) => !n.expanded)
                    .map((n) => {
                      const semantic = byId.get(n.id);
                      if (!semantic) return null;
                      const changed = false;
                      return (
                        <g
                          key={n.id}
                          role="button"
                          tabIndex={0}
                          aria-label={semantic.title}
                          data-map-node={n.id}
                          data-out-of-scope={!inScope(n.id)}
                          data-outcome={
                            semantic.kind === "end"
                              ? semantic.outcome || "completed"
                              : undefined
                          }
                          className={"map-node kind-" + semantic.kind}
                          data-upstream={focus && related.has(n.id)}
                          data-selected={selected === n.id}
                          data-changed={!!changed}
                          opacity={nodeOpacity(n.id)}
                          onClick={() => selectNode(n.id)}
                          onDoubleClick={() =>
                            semantic.kind === "group" && toggle(n.id)
                          }
                          onKeyDown={(e) => keyboard(e, n.id)}
                        >
                          <WorkflowMapNodeGlyph
                            node={n}
                            semantic={semantic}
                            meta={
                              semantic.kind === "group"
                                ? `${projected.nodes.find((x) => x.id === n.id)?.hiddenCount} 个内部活动`
                                : kindName[semantic.kind]
                            }
                          />

                          {nodeIssues(n.id).length > 0 && (
                            <circle
                              className="map-issue-dot"
                              cx={n.x + n.width - 9}
                              cy={n.y + 9}
                              r="6"
                            />
                          )}
                          {semantic.kind === "group" && (
                            <g
                              className="map-disclosure"
                              role="button"
                              tabIndex={0}
                              aria-label={"展开 " + semantic.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggle(n.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggle(n.id);
                                }
                              }}
                            >
                              <rect
                                x={n.x + n.width - 35}
                                y={n.y + n.height - 32}
                                width="26"
                                height="26"
                                rx="5"
                              />
                              <path
                                d={`M${n.x + n.width - 27} ${n.y + n.height - 23}l5 5l5 -5`}
                              />
                            </g>
                          )}
                        </g>
                      );
                    })}
                </g>
              </svg>
            )}
            {busy && <span className="map-layout-status">正在整理布局…</span>}
            {error && (
              <div className="map-layout-error" role="alert">
                {error}；请在验证台修正定义。
              </div>
            )}
          </div>
          {layout && (
            <WorkflowMapMinimap
              layout={layout}
              camera={camera}
              bounds={bounds}
              onMove={(next) => {
                setIsolate(false);
                move(next, false);
              }}
            />
          )}
        </div>
        {panel && (
          <aside
            className="map-inspector"
            aria-label={panel === "issues" ? "工作流检查" : "活动与关系详情"}
          >
            <div className="map-panel-head">
              <Typography variant="section-title">
                {panel === "issues"
                  ? "待检查问题"
                  : current?.title || "关系详情"}
              </Typography>
              <MapIconButton
                appearance="ghost"
                aria-label="关闭详情"
                onClick={() => setPanel(null)}
              >
                <Icon name="x" />
              </MapIconButton>
            </div>
            {panel === "issues" ? (
              <>
                <Typography variant="description" tone="secondary">
                  问题不阻止保存草稿，发布前需处理阻塞项。
                </Typography>
                {issues.length ? (
                  issues.map((i, index) => (
                    <Card key={index} heading={i.message}>
                      <Typography variant="meta" tone="muted">
                        {i.nodeId ? byId.get(i.nodeId)?.title : "整个工作流"}
                      </Typography>
                      {i.nodeId && (
                        <Button
                          appearance="ghost"
                          onClick={() => locate(i.nodeId!)}
                        >
                          定位活动
                        </Button>
                      )}
                      {i.edgeId && (
                        <Button
                          appearance="ghost"
                          onClick={() => {
                            const edge = currentIR.edges.find(
                              (e) => e.id === i.edgeId,
                            );
                            if (edge) {
                              locate(edge.from);
                              setSelected(edge.id);
                            }
                          }}
                        >
                          定位关系
                        </Button>
                      )}
                      <Button
                        appearance="ghost"
                        onClick={() => quote("请补充：" + i.message)}
                      >
                        引用到 Chat
                      </Button>
                    </Card>
                  ))
                ) : (
                  <Typography variant="description">
                    当前结构检查没有发现问题。完整的资源与执行准入检查仍需接入发布服务。
                  </Typography>
                )}
              </>
            ) : current ? (
              <>
                <Typography variant="meta" tone="muted">
                  {mapAncestors(currentIR, current.id)
                    .map((id) => byId.get(id)!.title)
                    .join(" / ") || "顶层活动"}
                </Typography>
                <Typography variant="description">
                  {current.description || "展开查看这段工作的内部结构。"}
                </Typography>
                {current.kind === "group" && (
                  <Button appearance="ghost" onClick={() => toggle(current.id)}>
                    {expanded.has(current.id) ? "收起内部活动" : "展开内部活动"}
                  </Button>
                )}
                <Button appearance="ghost" onClick={() => setFocus((v) => !v)}>
                  {focus ? "显示所有路径" : "突出上游路径"}
                </Button>
                {(["inputs", "outputs", "resources"] as const).map((key, i) => (
                  <section key={key}>
                    <Typography variant="label">
                      {["需要的材料", "形成的成果", "关联资源"][i]}
                    </Typography>
                    <Typography as="p" variant="description" tone="secondary">
                      {current[key]?.join("、") || "尚未补充"}
                    </Typography>
                  </section>
                ))}
                <Button
                  appearance="ghost"
                  onClick={() => quote("关于「" + current.title + "」：")}
                >
                  引用到 Chat
                </Button>
              </>
            ) : currentEdge ? (
              <>
                <Typography variant="description">
                  {byId.get(currentEdge.from)?.title} →{" "}
                  {byId.get(currentEdge.to)?.title}
                </Typography>
                <Typography variant="description" tone="secondary">
                  {currentEdge.label || "完成后继续"}
                </Typography>
                <Typography variant="description">
                  流程意图：
                  {currentEdge.intent
                    ? {
                        expected: "预期推进",
                        rework: "返工",
                        recovery: "恢复",
                        exit: "退出",
                      }[currentEdge.intent]
                    : "待确认"}
                </Typography>
                {currentEdge.trigger && (
                  <Typography variant="description" tone="secondary">
                    触发条件：{currentEdge.trigger}
                  </Typography>
                )}
                <Typography variant="meta" tone="muted">
                  这里显示实际端点；折叠不会改变关系。
                </Typography>
                <Button
                  appearance="ghost"
                  onClick={() => locate(currentEdge.from)}
                >
                  定位来源
                </Button>
                <Button
                  appearance="ghost"
                  onClick={() => locate(currentEdge.to)}
                >
                  定位去向
                </Button>
              </>
            ) : null}
          </aside>
        )}
      </div>
    </div>
  );
}
