import { useEffect, useRef, useState, type RefObject } from "react";
import { Icon } from "./icon";
export function ResourceGalleryGroup<T extends { id: string }>({
  title,
  tasks,
  columns,
  root,
  active,
  anchorId,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  tasks: readonly T[];
  columns: number;
  root: RefObject<HTMLDivElement | null>;
  active: boolean;
  anchorId?: string;
  collapsed: boolean;
  onToggle: () => void;
  children: (task: T) => React.ReactNode;
}) {
  const [count, setCount] = useState(() =>
    Math.max(columns, tasks.findIndex((task) => task.id === anchorId) + 1),
  );
  const marker = useRef<HTMLDivElement>(null);
  const visible = Math.max(columns, count);
  useEffect(() => {
    if (
      !active ||
      collapsed ||
      visible >= tasks.length ||
      !marker.current ||
      !root.current ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        const bounds = marker.current?.getBoundingClientRect(),
          viewport = root.current?.getBoundingClientRect();
        if (
          !bounds ||
          !viewport ||
          bounds.top > viewport.bottom + viewport.height * 0.5
        )
          return;
        setCount(
          (old) =>
            Math.max(old, columns) +
            columns *
              Math.max(
                1,
                Math.ceil(
                  viewport.height /
                    ((marker.current?.parentElement
                      ?.querySelector(".browser-task-card")
                      ?.getBoundingClientRect().height ?? 226) +
                      16),
                ),
              ),
        );
      },
      { root: root.current, rootMargin: "0px 0px 50% 0px" },
    );
    observer.observe(marker.current);
    return () => observer.disconnect();
  }, [active, collapsed, visible, tasks.length, columns, root]);
  return (
    <section className="browser-group">
      <button
        type="button"
        className="browser-group-heading"
        aria-expanded={!collapsed}
        onClick={onToggle}
      >
        <Icon name="chevron-down" />
        <span>{title}</span>
        <span className="group-count">{tasks.length}</span>
      </button>
      <div hidden={collapsed}>
        <div className="browser-flow">
          {tasks.slice(0, visible).map(children)}
        </div>
        {visible < tasks.length && (
          <div
            ref={marker}
            className="browser-load-marker"
            aria-hidden="true"
          />
        )}
      </div>
    </section>
  );
}
