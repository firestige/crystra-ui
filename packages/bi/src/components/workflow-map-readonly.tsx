import mapTokens from "../../../../design/workflow-map.tokens.json";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { WorkflowMapIR } from "../domain/workflow-map-ir";
import {
  layoutWorkflowMap,
  type MapLayout,
} from "../domain/workflow-map-engine";
import { frameMap } from "../domain/workflow-map-camera";
import { useWorkflowMapViewport } from "./use-workflow-map-viewport";
import { WorkflowMapNodeGlyph } from "./workflow-map-node-glyph";
import { Button } from "./design-system";
import "../workflow-map-workbench.css";
import "../workflow-map-readonly.css";
/** Read-only host for the existing Workflow engine; no samples or editor state. */
export function WorkflowMapReadonly({
  ir,
  labels,
  edgeLabels,
  nodeTones,
  edgeTones,
  renderOverlay,
  selected,
  onSelect,
  compact = false,
}: {
  ir: WorkflowMapIR;
  labels?: Readonly<Record<string, string>>;
  edgeLabels?: Readonly<Record<string, string>>;
  renderOverlay?: (layout: MapLayout) => ReactNode;
  edgeTones?: Readonly<Record<string, string>>;
  nodeTones?: Readonly<Record<string, string>>;
  selected?: string | null;
  onSelect?: (id: string) => void;
  compact?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const { camera, move, moving } = useWorkflowMapViewport(host);
  const moveRef = useRef(move);
  useLayoutEffect(() => {
    moveRef.current = move;
  });
  const [bounds, setBounds] = useState({
    width: 800,
    height: compact ? 280 : 420,
  });
  const [result, setResult] = useState<{
    ir: WorkflowMapIR;
    layout?: MapLayout;
    error?: string;
  } | null>(null);
  const marker = useId().replaceAll(":", "");
  useEffect(() => {
    const el = host.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth && el.clientHeight)
        setBounds((old) =>
          old.width === el.clientWidth && old.height === el.clientHeight
            ? old
            : { width: el.clientWidth, height: el.clientHeight },
        );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let active = true;
    layoutWorkflowMap(ir, new Set(), "RIGHT", bounds)
      .then((layout) => {
        if (!active) return;
        setResult({ ir, layout });
        moveRef.current(frameMap({ x: 0, y: 0, ...layout }, bounds), false);
      })
      .catch((error) => {
        if (active) setResult({ ir, error: String(error) });
      });
    return () => {
      active = false;
    };
  }, [ir, bounds]);
  const layout = result?.ir === ir ? result.layout : undefined;
  return (
    <div
      className="map-readonly"
      data-layout-engine="workflow-map"
      style={mapTokens.dark as CSSProperties}
    >
      <div className="map-readonly-controls">
        <Button
          disabled={!layout}
          onClick={() =>
            layout &&
            moveRef.current(frameMap({ x: 0, y: 0, ...layout }, bounds), false)
          }
        >
          适应画布
        </Button>
        <Button
          onClick={() =>
            moveRef.current(
              { ...camera, scale: Math.min(2, camera.scale * 1.25) },
              false,
            )
          }
        >
          放大
        </Button>
        <Button
          onClick={() =>
            moveRef.current(
              { ...camera, scale: Math.max(0.02, camera.scale / 1.25) },
              false,
            )
          }
        >
          缩小
        </Button>
      </div>
      <div
        ref={host}
        className="map-viewport map-readonly-viewport"
        style={{ height: compact ? 280 : 420 }}
        aria-label={ir.title}
        aria-busy={!layout && !result?.error}
        data-camera-moving={moving}
      >
        <svg width="100%" height="100%" role="group" aria-label={ir.title}>
          <defs>
            <marker
              id={marker}
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
            transform={`translate(${camera.x},${camera.y}) scale(${camera.scale})`}
          >
            {layout?.edges.map((e) => (
              <g
                key={e.segmentKey ?? e.id}
                className="map-edge"
                data-runtime-tone={edgeTones?.[e.id]}
              >
                <path
                  d={e.path}
                  markerEnd={e.arrow === false ? undefined : `url(#${marker})`}
                />
                <title>
                  {edgeLabels?.[e.id] ??
                    ir.edges.find((edge) => edge.id === e.id)?.label}
                </title>
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
                        <tspan key={i} x={e.label!.x + 4} dy={i ? 20 : 0}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                )}
              </g>
            ))}
            {layout?.nodes.map((n) => {
              const semantic = ir.nodes.find((item) => item.id === n.id);
              if (!semantic) return null;
              return (
                <g
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  className={`map-node kind-${semantic.kind}`}
                  data-map-node={n.id}
                  data-runtime-tone={nodeTones?.[n.id]}
                  data-selected={selected === n.id}
                  aria-label={`${labels?.[n.id] ? labels[n.id] + "：" : ""}${semantic.title}`}
                  onClick={() => onSelect?.(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect?.(n.id);
                    }
                  }}
                >
                  <WorkflowMapNodeGlyph
                    node={n}
                    semantic={semantic}
                    meta={labels?.[n.id]}
                  />
                </g>
              );
            })}
            {layout && renderOverlay?.(layout)}
          </g>
        </svg>
        {result?.ir === ir && result.error && (
          <div role="alert">图布局失败：{result.error}</div>
        )}
      </div>
    </div>
  );
}
