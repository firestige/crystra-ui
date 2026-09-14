import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { Tabs } from "./collection-components";
import { Typography } from "./design-system";
import "../page-header.css";
import "../workflow-workbench.css";
const pages = [
  ["studio", "流程设计"],
  ["resources", "资源配置"],
  ["crystallization", "结晶分析"],
] as const;
export type WorkflowWorkbenchPage = (typeof pages)[number][0];
/** Exact workflow context and host Input are shared across the three projections. */
export function WorkflowWorkbench({
  definitionId,
  revision,
  title,
  description,
  input,
  page,
  onPageChange,
  panels,
  context,
  initialInputWidth,
  onInputWidthChange,
}: {
  definitionId: string;
  revision: string;
  title: string;
  description: string;
  input: ReactNode;
  page: WorkflowWorkbenchPage;
  onPageChange: (page: WorkflowWorkbenchPage) => void;
  panels: Record<WorkflowWorkbenchPage, ReactNode>;
  context?: ReactNode;
  initialInputWidth?: number;
  onInputWidthChange?: (width: number) => void;
}) {
  const [panelHost, setPanelHost] = useState<HTMLDivElement | null>(null),
    [available, setAvailable] = useState(1040),
    [preferred, setPreferred] = useState(() =>
      typeof initialInputWidth === "number" &&
      Number.isFinite(initialInputWidth)
        ? initialInputWidth
        : 400,
    );
  const region = useRef<HTMLDivElement>(null);
  const maximum = Math.max(360, available / 2),
    width = Math.min(maximum, Math.max(360, preferred));
  useEffect(() => {
    const node = region.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const measure = () => setAvailable(Math.max(720, node.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const resize = (next: number) => {
    const value = Math.min(maximum, Math.max(360, next));
    setPreferred(value);
    onInputWidthChange?.(value);
  };
  return (
    <section
      className="crystra-workflow-workbench"
      data-definition-id={definitionId}
      data-revision={revision}
    >
      <header
        className="wb-header wb-page-header studio-header"
        data-section-id="workspace-header"
      >
        <div data-header-slot="identity">
          <Typography as="h1" variant="page-title">
            {title}
          </Typography>
          <Typography as="p" variant="description" tone="secondary">
            {description}
          </Typography>
        </div>
        <div data-header-slot="navigation">
          <Tabs
            aria-label="工作流工作面"
            value={page}
            onValueChange={(value) =>
              onPageChange(value as WorkflowWorkbenchPage)
            }
            appearance="underline"
            panelContainer={panelHost}
            items={pages.map(([value, label]) => ({
              value,
              label,
              panel: panels[value],
            }))}
          />
        </div>
        <div data-header-slot="context">
          <span title={revision}>{revision}</span>
          {context}
        </div>
      </header>
      <div
        className="crystra-workflow-layout"
        ref={region}
        style={{ "--workflow-input-width": `${width}px` } as CSSProperties}
      >
        <section data-section-id="input-stream" data-host-owned="dsh-input">
          {input}
        </section>
        <div
          role="separator"
          tabIndex={0}
          aria-label="调整工作流对话宽度"
          aria-orientation="vertical"
          aria-valuemin={360}
          aria-valuemax={Math.round(maximum)}
          aria-valuenow={Math.round(width)}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            resize(
              event.key === "Home"
                ? 360
                : event.key === "End"
                  ? maximum
                  : width + (event.key === "ArrowRight" ? 16 : -16),
            );
          }}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              const left = region.current?.getBoundingClientRect().left;
              if (left !== undefined) resize(event.clientX - left);
            }
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
          }}
        />
        <div data-section-id="workflow-projections" ref={setPanelHost} />
      </div>
    </section>
  );
}
