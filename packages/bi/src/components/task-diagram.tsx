import { createElement, useId, useRef, useState, type ReactNode } from "react";
import { Button, Typography } from "./design-system";
import "../task-diagram.css";
import { isTaskDiagram, type TaskDiagramNode } from "../domain/task-diagram";
export function TaskDiagram({
  diagram,
  label,
  selectableIds = [],
  onSelect,
  query = "",
}: {
  diagram: unknown;
  label: string;
  selectableIds?: readonly string[];
  onSelect?: (id: string) => void;
  query?: string;
}) {
  const prefix = useId().replace(/[^a-zA-Z0-9]/g, "") + "-";
  if (!isTaskDiagram(diagram)) return <p role="status">图投影不可用</p>;
  const render = (
    node: TaskDiagramNode | string,
    key: number,
    root = false,
  ): ReactNode => {
    if (typeof node === "string") return node;
    const id = node.props["data-dag-node"] ?? node.props["data-section-id"];
    const selectable = !!id && selectableIds.includes(id) && !!onSelect;
    const props = Object.fromEntries(
      Object.entries(node.props).map(([k, v]) => [
        k,
        k === "id"
          ? prefix + v
          : v.replace(/^url\(#([\w.-]+)\)$/, `url(#${prefix}$1)`),
      ]),
    );
    return createElement(
      node.tag,
      {
        ...props,
        key,
        ...(query && node.props["data-node-label"]
          ? {
              opacity: node.props["data-node-label"].includes(query) ? 1 : 0.25,
            }
          : {}),
        ...(root
          ? {
              role: "img",
              "aria-label": label,
              "aria-hidden": undefined,
              width: "100%",
              height: "100%",
            }
          : {}),
        ...(selectable
          ? {
              role: "button",
              tabIndex: 0,
              "aria-label":
                node.props["aria-label"] ?? node.props["data-node-label"] ?? id,
              style: { cursor: "pointer" },
              onClick: () => onSelect(id),
              onKeyDown: (event: React.KeyboardEvent) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(id);
                }
              },
            }
          : {}),
      },
      ...node.children.map((child, i) => render(child, i)),
    );
  };
  return render(diagram, 0, true);
}
export function TaskDiagramExplorer({
  diagram,
  label,
}: {
  diagram: unknown;
  label: string;
}) {
  const [zoom, setZoom] = useState(1),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string>();
  const viewport = useRef<HTMLDivElement>(null),
    pan = useRef<
      { x: number; y: number; left: number; top: number } | undefined
    >(undefined);
  if (!isTaskDiagram(diagram)) return <p role="status">图投影不可用</p>;
  const box = diagram.props.viewBox.split(/[ ,]+/).map(Number),
    ids: string[] = [];
  const collect = (node: TaskDiagramNode | string) => {
    if (typeof node === "string") return;
    const id = node.props["data-dag-node"];
    if (id) ids.push(id);
    node.children.forEach(collect);
  };
  collect(diagram);
  return (
    <section className="crystra-task-diagram-explorer">
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
            setZoom(
              Math.min(1, (viewport.current?.clientWidth ?? box[2]) / box[2]),
            )
          }
        >
          适应视图
        </Button>
      </header>
      <div
        className="crystra-task-diagram-viewport"
        ref={viewport}
        onPointerDown={(e) => {
          if ((e.target as Element).closest('[role="button"]')) return;
          pan.current = {
            x: e.clientX,
            y: e.clientY,
            left: e.currentTarget.scrollLeft,
            top: e.currentTarget.scrollTop,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!pan.current) return;
          e.currentTarget.scrollLeft =
            pan.current.left + pan.current.x - e.clientX;
          e.currentTarget.scrollTop =
            pan.current.top + pan.current.y - e.clientY;
        }}
        onPointerUp={() => {
          pan.current = undefined;
        }}
        onPointerCancel={() => {
          pan.current = undefined;
        }}
      >
        <div style={{ width: box[2] * zoom, height: box[3] * zoom }}>
          <TaskDiagram
            diagram={diagram}
            label={label}
            query={query}
            selectableIds={ids}
            onSelect={setSelected}
          />
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
