/* eslint-disable react-refresh/only-export-components -- Standalone preview entry mounts React roots; components are not imported as HMR boundaries. */
import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AnalysisObservationStudy } from "./components/analysis-observation-study";
import { Tabs } from "./components/collection-components";
import { Button, Card, Chip, Typography } from "./components/design-system";
import { Icon, type IconName } from "./components/icon";
import { WorkflowActivityStudy } from "./components/workflow-activity-study";
import { WorkflowMapWorkbench } from "./components/workflow-map-workbench";
import { WorkflowResourceBrowser } from "./components/workflow-resource-browser";
import "./crystra-components.css";
import "./crystra-theme.css";
import type { WorkflowMapIR } from "./domain/workflow-map-ir";
import { workflowStudioContext } from "./domain/workflow-studio-context";
import "./primitives.css";
import "./shared.css";
import "./styles.css";
import "./test-harness/test-harness.css";

const params = new URLSearchParams(location.search);
const root = document.getElementById("workbench-root")!;
const studio = root.dataset.page === "workflow-studio";
const hostInput =
  document.getElementById("workbench-host-input")?.innerHTML ?? "";
function Copy({ children }: { children: ReactNode }) {
  return (
    <Typography as="p" variant="description" tone="secondary">
      {children}
    </Typography>
  );
}
function Fields({
  items,
}: {
  items: readonly (readonly [string, ReactNode])[];
}) {
  return (
    <dl className="wb-fields">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="wb-empty">
      <Icon name="file" size="widget-signal" />
      <Typography variant="item-title">{title}</Typography>
      {children && <Copy>{children}</Copy>}
    </div>
  );
}
function ContextFailure({ isNew = false }: { isNew?: boolean }) {
  return (
    <Card
      data-section-id="unresolved-context"
      heading={isNew ? "开始设计工作流" : "当前来源尚未解析"}
    >
      <Empty title={isNew ? "描述你希望复用的流程" : "没有对应的本地示例"}>
        {isNew
          ? "在左侧 Chat 描述目标、输入和预期结果。"
          : "保留指定身份；接入真实数据后按此范围读取。"}
      </Empty>
      {!isNew && (
        <Fields
          items={[...params.entries()].filter(([key]) => key !== "view")}
        />
      )}
    </Card>
  );
}
const nodes: readonly {
  id: string;
  label: string;
  kind: string;
  icon: IconName;
  copy: string;
}[] = [
  {
    id: "ReleaseRequest",
    label: "发布请求",
    kind: "输入",
    icon: "file",
    copy: "接收发布对象与输入参数，进入定义允许的检查路径。",
  },
  {
    id: "PackageValidation",
    label: "包校验",
    kind: "确定性步骤",
    icon: "shield-lock",
    copy: "检查构建产物的输入与输出契约。",
  },
  {
    id: "MarketCompatibility",
    label: "市场兼容性",
    kind: "检查步骤",
    icon: "target",
    copy: "观察允许的兼容性检查路径。节点选择只影响当前 Inspector。",
  },
  {
    id: "PublishPackage",
    label: "发布包",
    kind: "输出步骤",
    icon: "arrow-up-right",
    copy: "表示定义中的发布步骤；此处不触发发布。",
  },
  {
    id: "HumanReview",
    label: "人工审核",
    kind: "审核分支",
    icon: "clipboard-list",
    copy: "展示定义中的人工审核分支，不在图上提交裁决。",
  },
  {
    id: "AdjustPolicy",
    label: "调整策略",
    kind: "修订分支",
    icon: "adjustments-horizontal",
    copy: "具体修订意图由 Chat 提出，图中不提供编辑或连线。",
  },
];
function WorkflowBench({
  tab,
  resolved,
  isNew,
  activityStudy,
  onDesign,
}: {
  tab: string;
  resolved: boolean;
  isNew: boolean;
  activityStudy: boolean;
  onDesign: () => void;
}) {
  const [selected, setSelected] = useState("MarketCompatibility");
  const node = nodes.find((n) => n.id === selected)!;
  if (!resolved) return <ContextFailure isNew={isNew} />;
  if (activityStudy)
    return (
      <WorkflowActivityStudy
        mode={tab === "crystallization" ? "crystallization" : "design"}
        onDesign={onDesign}
      />
    );
  return (
    <div className="wb-stack">
      <div className="wb-section-heading">
        <Typography as="h2" variant="section-title">
          {tab === "crystallization" ? "结晶分析" : "流程设计"}
        </Typography>
        <Chip>v3</Chip>
      </div>
      {tab === "crystallization" && (
        <Card heading="暂无执行样本">
          <Copy>
            当前工作流版本尚未接入 Delivery 证据。选择图中节点并通过 Chat
            指定分析范围；没有证据时不生成结晶结论。
          </Copy>
        </Card>
      )}
      <Card
        heading="允许拓扑"
        description="查看定义允许的步骤与分支，选择节点查看详情。"
        data-section-id="workflow-map"
        actions={
          <Button
            appearance="ghost"
            size="compact"
            onClick={() =>
              document
                .getElementById("workflow-map-canvas")
                ?.scrollTo({ left: 0, top: 0, behavior: "smooth" })
            }
          >
            适应视图
          </Button>
        }
      >
        <div id="workflow-map-canvas" className="wb-map">
          <div className="wb-map-grid">
            <svg
              className="wb-map-edges"
              viewBox="0 0 1000 260"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M125 68H875 M625 68V202H375" />
            </svg>
            {nodes.map((n, i) => (
              <button
                key={n.id}
                className="wb-node"
                style={{
                  gridColumn: i < 4 ? i + 1 : i === 4 ? 3 : 2,
                  gridRow: i < 4 ? 1 : 2,
                }}
                aria-label={n.label}
                aria-pressed={selected === n.id}
                onClick={() => setSelected(n.id)}
              >
                <span className="wb-node-top">
                  <Icon name={n.icon} size="content-marker" />
                  <span>{n.kind}</span>
                </span>
                <Typography variant="item-title">{n.label}</Typography>
                <Typography variant="meta" tone="muted">
                  {n.id}
                </Typography>
              </button>
            ))}
          </div>
        </div>
      </Card>
      <div className="wb-inspector-grid">
        <Card
          data-section-id="workflow-inspector"
          heading="节点详情"
          actions={<Icon name={node.icon} size="content-marker" />}
        >
          <Typography variant="item-title">{node.label}</Typography>
          <Copy>{node.copy}</Copy>
          <Button
            appearance="ghost"
            onClick={() => {
              const input = document.querySelector<HTMLTextAreaElement>(
                '[data-host-owned="dsh-input"] textarea',
              );
              if (input) {
                input.value +=
                  (input.value ? "\n\n" : "") +
                  (tab === "crystallization"
                    ? "请研究结晶可能性："
                    : "请调整配置：") +
                  "build-and-sign@v3 / " +
                  node.id +
                  "，请先展示候选差异，不应用。";
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.focus();
              }
            }}
          >
            {tab === "crystallization" ? "在 Chat 中研究" : "在 Chat 中调整"}
          </Button>
          <Fields
            items={[
              ["节点 ID", node.id],
              ["版本", "v3"],
              ["种类", node.kind],
            ]}
          />
        </Card>
        <Card
          data-section-id="workflow-diff"
          heading="候选差异"
          actions={<Icon name="arrows-exchange" size="content-marker" />}
        >
          <Empty title="没有候选变更">
            Chat 生成候选后，在这里查看具体差异。
          </Empty>
        </Card>
        <Card
          data-section-id="workflow-validation"
          heading="校验材料"
          actions={<Icon name="shield-lock" size="content-marker" />}
        >
          <Fields
            items={[
              ["定义校验", <Chip key="a">暂无结果</Chip>],
              ["来源证据", <Chip key="b">暂无材料</Chip>],
              ["候选兼容性", <Chip key="c">未比较</Chip>],
            ]}
          />
          <Copy>尚无校验结论。</Copy>
        </Card>
      </div>
    </div>
  );
}
const HostInput = memo(function HostInput({ markup }: { markup: string }) {
  return (
    <div
      className="wb-host-input"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
});
function App() {
  const split = useRef<HTMLDivElement>(null),
    [available, setAvailable] = useState(1200),
    [chatWidth, setChatWidth] = useState(380),
    [resizing, setResizing] = useState(false);
  const limit = (w: number, total: number) =>
    Math.min(Math.max(360, total / 2), Math.max(360, w));
  useEffect(() => {
    const el = split.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const w = el.clientWidth;
      setAvailable(w);
      setChatWidth((old) => limit(old, w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const context = workflowStudioContext(params);
  const tabs = studio
    ? [
        ["studio", "流程设计"],
        ["resources", "资源配置"],
        ["crystallization", "结晶分析"],
      ]
    : [
        ["analysis", "分析"],
        ["audit", "审计"],
        ["compare", "比较"],
      ];
  const [tab, setTab] = useState(context.view);
  const [workflow, setWorkflow] = useState<WorkflowMapIR | null>(null),
    [requestedNode] = useState<{ id: string; seq: number } | null>(null);
  const [identity, setIdentity] = useState({
    title: context.title,
    description: context.description,
  });
  const { isNew, activityStudy, resolved } = context;
  const inputMarkup = resolved
    ? activityStudy
      ? hostInput
          .replace(
            "我想把重复的包校验与市场兼容性检查整理成可复用工作流，异常时进入人工审核。",
            "请按 Implementation 的权威阶段展示主流程，展开先测试后实现的阶梯，并保留按需外查的入口。",
          )
          .replace(
            "右侧是构建与签名工作流的只读示例。你可以继续描述输入、输出与异常处理，再由 Chat 生成修订提案。",
            "右侧以活动图展示当前工作流。选择节点可检查资源绑定，并将修改意图带入 Chat；结晶分析用执行样本研究可固化为 template 或 script 的工作。",
          )
      : hostInput
    : hostInput.replace(/<article[\s\S]*?<\/article>/g, "");
  const changeTab = (value: string) => {
    setTab(value);
    params.set("view", value);
    history.replaceState(null, "", "?" + params.toString());
    if (!studio) {
      document
        .querySelectorAll(
          '[data-section-id^="analysis-"][data-section-id$="-action"]',
        )
        .forEach((el) => {
          el.removeAttribute("aria-current");
        });
      document
        .querySelector(
          '[data-section-id="analysis-' +
            (value === "analysis" ? "traces" : value) +
            '-action"]',
        )
        ?.setAttribute("aria-current", "page");
    }
  };
  return (
    <section className="wb-host" data-section-id="main-surface-host">
      <header
        className="wb-header wb-page-header studio-header"
        data-section-id="workspace-header"
      >
        <div data-header-slot="identity" className="wb-identity">
          <span className="wb-context-icon">
            <Icon
              name={studio ? "git-branch" : "activity"}
              size="context-marker"
            />
          </span>
          <div>
            <Typography as="h1" variant="page-title">
              {identity.title}
            </Typography>
            <Copy>{identity.description}</Copy>
          </div>
        </div>
        <div data-header-slot="navigation">
          <Tabs
            appearance="underline"
            aria-label={studio ? "工作流工作面" : "分析工作面"}
            value={tab}
            onValueChange={changeTab}
            items={tabs.map(([value, label]) => ({
              value,
              label: <span data-wb-tab={value}>{label}</span>,
              panel: null,
            }))}
          />
        </div>
        <div data-header-slot="context">
          {activityStudy ? null : studio ? (
            <>
              <Typography variant="meta" tone="muted">
                {activityStudy ? "" : isNew ? "工作流工作台" : "当前版本"}
              </Typography>
              <Chip tone={resolved ? "primary" : "neutral"}>
                {activityStudy
                  ? "工作流设计"
                  : resolved
                    ? "v3"
                    : isNew
                      ? "未生成定义"
                      : params.get("revision") || "缺少版本"}
              </Chip>
            </>
          ) : (
            <>
              <Icon name="shield-lock" />
              <Typography variant="meta" tone="muted">
                只读工作面
              </Typography>
            </>
          )}
        </div>
      </header>
      {studio ? (
        <div
          className="wb-studio-layout"
          ref={split}
          data-resizing={resizing}
          style={{ gridTemplateColumns: `${chatWidth}px 6px minmax(0,1fr)` }}
        >
          <HostInput markup={inputMarkup} />
          <div
            className="wb-chat-divider"
            role="separator"
            aria-label="调整对话栏宽度"
            aria-orientation="vertical"
            tabIndex={0}
            aria-valuemin={360}
            aria-valuemax={Math.max(360, Math.floor(available / 2))}
            aria-valuenow={Math.round(chatWidth)}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              setResizing(true);
            }}
            onPointerMove={(e) => {
              if (
                e.currentTarget.hasPointerCapture(e.pointerId) &&
                split.current
              )
                setChatWidth(
                  limit(
                    e.clientX - split.current.getBoundingClientRect().left - 3,
                    available,
                  ),
                );
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                e.currentTarget.releasePointerCapture(e.pointerId);
              setResizing(false);
            }}
            onPointerCancel={() => setResizing(false)}
            onLostPointerCapture={() => setResizing(false)}
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                setChatWidth((old) =>
                  limit(
                    e.key === "Home"
                      ? 360
                      : e.key === "End"
                        ? available / 2
                        : old + (e.key === "ArrowLeft" ? -16 : 16),
                    available,
                  ),
                );
              }
            }}
          />
          <div className="wb-display">
            <section
              hidden={tab === "resources"}
              className="wb-scroll wb-studio-bench"
              data-section-id="control-bench"
            >
              {activityStudy ? (
                <WorkflowMapWorkbench
                  onWorkflow={setWorkflow}
                  requestedNode={requestedNode}
                  mode={tab}
                  onIdentity={(title, description) =>
                    setIdentity({ title, description })
                  }
                />
              ) : (
                <WorkflowBench
                  tab={tab}
                  resolved={resolved}
                  isNew={isNew}
                  activityStudy={activityStudy}
                  onDesign={() => changeTab("studio")}
                />
              )}
            </section>
            <div hidden={tab !== "resources"} className="wb-resource-display">
              {workflow && (
                <WorkflowResourceBrowser
                  key={workflow.title}
                  workflow={workflow}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <AnalysisObservationStudy />
      )}
    </section>
  );
}
createRoot(root).render(studio ? <App /> : <AnalysisObservationStudy />);
