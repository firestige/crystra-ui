import { createElement, useState, useRef, type ReactNode } from "react";
import graphs from "./task-design-graphs.json";
import { Button, Typography } from "../components/design-system";
interface DesignNode {
  tag: string;
  props: Record<string, string>;
  children: (DesignNode | string)[];
}
/** Exact static v8 drawings, exclusively for conditional design exploration. */
export function TaskDesignGraph({
  name,
  onSelect,
  query = "",
}: {
  name: keyof typeof graphs.graphs;
  onSelect?: (id: string) => void;
  query?: string;
}) {
  const render = (node: DesignNode | string, key: number): ReactNode => {
    if (typeof node === "string") return node;
    const id = node.props["data-dag-node"] ?? node.props["data-section-id"];
    const label = node.props["data-node-label"];
    const selectable = onSelect && (label || id === "execution-plan-wave-1b");
    return createElement(
      node.tag,
      {
        ...node.props,
        key,
        ...(node.tag === "svg"
          ? {
              role: "img",
              ...(name === "workflow"
                ? { "aria-label": "工作流运行路径：已发生路径与下一步候选" }
                : {}),
            }
          : {}),
        ...(label && query
          ? { opacity: label.includes(query) ? 1 : 0.25 }
          : {}),
        ...(selectable
          ? {
              role: "button",
              tabIndex: 0,
              "aria-label": label ?? "查看批次 1B 的工作流运行",
              style: { cursor: "pointer" },
              onClick: () => onSelect(id!),
              onKeyDown: (event: React.KeyboardEvent) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(id!);
                }
              },
            }
          : {}),
      },
      ...node.children.map(render),
    );
  };
  return render(graphs.graphs[name] as DesignNode, 0);
}
export function TaskPlanDagExploration() {
  const [zoom, setZoom] = useState(1),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string>();
  const viewport = useRef<HTMLDivElement>(null);
  const pan = useRef<
    { x: number; y: number; left: number; top: number } | undefined
  >(undefined);
  return (
    <section className="crystra-design-dag">
      <header>
        <input
          aria-label="搜索计划节点"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}>
          缩小
        </Button>
        <Button onClick={() => setZoom((z) => Math.min(2, z + 0.2))}>
          放大
        </Button>
        <Button
          onClick={() =>
            setZoom(Math.min(1, (viewport.current?.clientWidth ?? 1280) / 1280))
          }
        >
          适应视图
        </Button>
      </header>
      <div
        ref={viewport}
        className="crystra-design-dag-viewport"
        onPointerDown={(event) => {
          if ((event.target as Element).closest('[role="button"]')) return;
          pan.current = {
            x: event.clientX,
            y: event.clientY,
            left: event.currentTarget.scrollLeft,
            top: event.currentTarget.scrollTop,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!pan.current) return;
          event.currentTarget.scrollLeft =
            pan.current.left + pan.current.x - event.clientX;
          event.currentTarget.scrollTop =
            pan.current.top + pan.current.y - event.clientY;
        }}
        onPointerUp={() => {
          pan.current = undefined;
        }}
        onPointerCancel={() => {
          pan.current = undefined;
        }}
      >
        <div style={{ width: 1280 * zoom, height: 620 * zoom }}>
          <TaskDesignGraph name="plan" query={query} onSelect={setSelected} />
        </div>
      </div>
      <Typography as="p" variant="meta">
        {selected
          ? `选中计划节点：${selected}`
          : "选择节点查看身份；缩放与搜索只改变视图。"}
      </Typography>
    </section>
  );
}
