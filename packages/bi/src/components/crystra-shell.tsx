import {
  memo,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { sidebarInnerHtml, sidebarClassName } from "./v8-sidebar/template";
import { sidebarInteractionCorrections } from "./v8-sidebar/interaction-corrections";
import { sidebarCss } from "./v8-sidebar/styles";
import { mountV8Sidebar } from "./v8-sidebar/runtime";
import {
  V8SearchAdapter,
  type SearchBinding,
} from "./v8-sidebar/search-adapter";
export type CrystraPage =
  | "new-task"
  | "tasks"
  | "task"
  | "workflows"
  | "workflow"
  | "analysis-overview"
  | "analysis-traces"
  | "analysis-reports";
export interface CrystraNavigationRecord {
  id: string;
  title: string;
  revision?: string;
  createdAt?: string;
  lastActivityAt?: string;
  inactive?: boolean;
}
export interface CrystraShellProps {
  /** Accepted v8 configuration selectors; defaults match the approved prototype. */
  "data-palette"?: string;
  "data-typography"?: string;
  "data-icon-scale"?: string;
  "data-crystra-theme"?: string;
  /** Overrides use the original semantic custom properties, without resolving them to pixels. */
  style?: CSSProperties & { [token: `--${string}`]: string | number };
  route: CrystraPage;
  selectedId?: string;
  tasks: readonly CrystraNavigationRecord[];
  workflows: readonly CrystraNavigationRecord[];
  onNavigate: (page: CrystraPage, id?: string, revision?: string) => void;
  onOpenHarness: () => void;
  onNewTask: () => void;
  onOpenSettings: () => void;
  children: ReactNode;
  settings?: ReactNode;
  initialSidebarCollapsed?: boolean;
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
}

const SidebarMarkup = memo(function SidebarMarkup() {
  return (
    <aside
      data-section-id="sidebar"
      id="crystra-sidebar"
      aria-label="Crystra 导航"
      className={sidebarClassName}
      dangerouslySetInnerHTML={{ __html: sidebarInnerHtml }}
    />
  );
});

/** The accepted v8 DOM and interaction implementation, with host/data substitutions only. */
export function CrystraShell(props: CrystraShellProps) {
  const root = useRef<HTMLDivElement>(null);
  const runtime = useRef<ReturnType<typeof mountV8Sidebar> | null>(null);
  const latest = useRef(props);
  const [bindings, setBindings] = useState<SearchBinding[]>([]);
  useLayoutEffect(() => {
    latest.current = props;
    runtime.current?.update(props);
  });
  useLayoutEffect(() => {
    const node = root.current!;
    node.dataset.sidebarCollapsed = "false";
    const controller = mountV8Sidebar(node, latest.current);
    runtime.current = controller;
    controller.update(latest.current);
    const seats: SearchBinding[] = [];
    for (const kind of ["task", "workflow"]) {
      const control = node.querySelector<HTMLElement>(
        `[data-section-id="${kind}-search-control"]`,
      )!;
      seats.push({
        kind,
        control,
        input: control.querySelector("input")!,
        action: control.querySelector<HTMLButtonElement>(
          `[data-section-id="${kind}-search-action"]`,
        )!,
        close: control.querySelector<HTMLButtonElement>(
          `[data-section-id="${kind}-search-clear"]`,
        )!,
      });
      control.replaceChildren();
      control.classList.add("crystra-search-bridge-sidebar");
    }
    setBindings(seats);
    return () => {
      controller.dispose();
      runtime.current = null;
    };
  }, []);
  return (
    <div
      ref={root}
      className="crystra-product-shell crystra-v8-shell"
      data-section-id="app-shell"
      data-product-surface="crystra"
      data-ui-locale="zh-CN"
      data-palette={props["data-palette"] ?? "semantic"}
      data-typography={props["data-typography"] ?? "balanced"}
      data-icon-scale={props["data-icon-scale"] ?? "dsh"}
      data-crystra-theme={props["data-crystra-theme"] ?? "dark"}
      style={{
        background: "var(--color-background-shell)",
        color: "var(--color-text-primary)",
        ...props.style,
      }}
    >
      <style>{sidebarCss + sidebarInteractionCorrections}</style>
      <SidebarMarkup />
      <main data-section-id="product-page">{props.children}</main>
      <div
        data-section-id="sidebar-tooltip"
        role="tooltip"
        id="crystra-sidebar-tooltip"
        hidden
      />
      {bindings.map((binding) =>
        createPortal(
          <V8SearchAdapter {...binding} />,
          binding.control,
          binding.kind,
        ),
      )}
    </div>
  );
}
