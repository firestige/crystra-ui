import { GateWorkbench } from "./gate";
import { DeliveryWorkbench } from "./delivery";
import { ExecutionWorkbench } from "./execution";
import { PlanWorkbench } from "./plan";
import { GrillingWorkbench } from "./grilling";
import type { ReactNode } from "react";
import { Card, EmptyState, Tabs, WorkbenchSummaryCard } from "../public";
import "./task-workbench.css";

export type WorkbenchSurface =
  "grilling" | "plan" | "execution" | "gate" | "delivery";
const WORKBENCH_SURFACES: readonly {
  value: WorkbenchSurface;
  label: string;
}[] = [
  { value: "grilling", label: "需求" },
  { value: "plan", label: "计划" },
  { value: "execution", label: "执行" },
  { value: "gate", label: "审核" },
  { value: "delivery", label: "交付" },
];

/** Display slots only. The host owns task identity, projections and browsing state. */
export interface TaskWorkbenchProps {
  value: WorkbenchSurface;
  onValueChange: (surface: WorkbenchSurface) => void;
  /** Only set from an explicit owner projection; never infer from the selected tab. */
  systemFocus?: WorkbenchSurface;
  panels?: Partial<Record<WorkbenchSurface, ReactNode>>;
  status?: ReactNode;
  navigationIndicators?: Partial<Record<WorkbenchSurface, ReactNode>>;
  navigationContainer?: HTMLElement | null;
}

const sections: Record<WorkbenchSurface, readonly [string, string, string][]> =
  {
    grilling: [
      ["grilling-overview", "需求澄清", "问题覆盖信息尚不可用"],
      ["grilling-question-map", "问题地图", "问题与来源尚不可用"],
      ["grilling-live-brief", "Live Brief", "目标、约束与未解问题尚不可用"],
      ["grilling-brief-changes", "本轮变化", "Brief 版本变化尚不可用"],
    ],
    plan: [
      ["plan-outcome-summary", "计划摘要", "计划版本尚不可用"],
      ["plan-dag-projection", "执行路径", "计划 DAG 尚不可用"],
      ["control-envelope", "控制边界", "自治范围、人工关口与恢复条件尚不可用"],
      ["proof-readiness", "验证准备", "验收条件与证据准备情况尚不可用"],
      ["context-health", "上下文健康", "权威来源、假设与冲突尚不可用"],
    ],
    execution: [
      ["execution-plan-run-overview", "Plan Run", "执行投影尚不可用"],
      ["execution-plan-run-map", "执行图", "尚无可读取的 Plan Run 图"],
      ["execution-wave-outcomes", "Wave 产出", "Wave 运行身份与产出尚不可用"],
    ],
    gate: [
      ["gate-review-overview", "当前审核", "审核信息尚不可用"],
      ["gate-relevant-decisions", "已确认决定", "确认记录尚不可用"],
      ["gate-current-interpretation", "AI 当前理解", "当前理解与变化尚不可用"],
      ["gate-execution-preview", "控制效果", "执行影响与不变边界尚不可用"],
      ["gate-evidence", "支撑证据", "精确证据引用尚不可用"],
    ],
    delivery: [
      ["delivery-current-readiness", "当前可交付状态", "可交付性尚不可用"],
      ["delivery-artifacts", "候选产物", "产物与精确版本尚不可用"],
      ["delivery-acceptance", "验收覆盖", "验收结论与证据尚不可用"],
      ["delivery-residual-risk", "剩余风险", "风险及阻断判断尚不可用"],
      ["delivery-economics", "累计投入", "Task 耗时、成本与注意力数据尚不可用"],
    ],
  };

/** Unknown projections retain the accepted card layout, without invented zero/success facts. */
export function UnavailableWorkbenchSurface({
  surface,
}: {
  surface: WorkbenchSurface;
}) {
  return (
    <div className="crystra-workbench-cards" data-control-surface={surface}>
      {sections[surface].map(([id, heading, label], index) =>
        index === 0 ? (
          <WorkbenchSummaryCard
            key={id}
            data-section-id={id}
            title={heading}
            description={label}
            tone="neutral"
            icon={
              surface === "execution"
                ? "activity"
                : surface === "gate"
                  ? "shield-lock"
                  : surface === "delivery"
                    ? "check"
                    : "file"
            }
            className="crystra-workbench-card-wide"
          />
        ) : (
          <Card
            key={id}
            heading={heading}
            data-section-id={id}
            className={
              index === 0 || (surface === "plan" && index === 1)
                ? "crystra-workbench-card crystra-workbench-card-wide"
                : "crystra-workbench-card"
            }
          >
            <EmptyState label={label} />
          </Card>
        ),
      )}
    </div>
  );
}

export function TaskWorkbench({
  value,
  onValueChange,
  systemFocus,
  panels = {},
  status,
  navigationContainer,
  navigationIndicators,
}: TaskWorkbenchProps) {
  return (
    <section
      className="crystra-bi crystra-task-workbench"
      data-crystra-theme="dark"
      data-section-id="control-workspace"
      aria-label="任务工作台"
    >
      {status && <div className="crystra-workbench-status">{status}</div>}
      <Tabs
        aria-label="任务工作面"
        navigationContainer={navigationContainer}
        appearance={navigationContainer ? "underline" : "soft"}
        value={value}
        onValueChange={(next) => {
          if (WORKBENCH_SURFACES.some((item) => item.value === next))
            onValueChange(next as WorkbenchSurface);
        }}
        items={WORKBENCH_SURFACES.map(({ value: surface, label }) => ({
          value: surface,
          label: (
            <span
              data-section-id={`workbench-nav-${surface}`}
              className="crystra-workbench-tab-label"
              data-system-active={systemFocus === surface || undefined}
              data-system-surface={
                systemFocus === surface ? surface : undefined
              }
            >
              {label}
              {navigationIndicators?.[surface]}
              {systemFocus === surface && (
                <span className="crystra-workbench-accessible-status">
                  系统当前
                </span>
              )}
            </span>
          ),
          panel:
            panels[surface] ??
            (surface === "grilling" ? (
              <GrillingWorkbench />
            ) : surface === "plan" ? (
              <PlanWorkbench />
            ) : surface === "execution" ? (
              <ExecutionWorkbench />
            ) : surface === "gate" ? (
              <GateWorkbench />
            ) : surface === "delivery" ? (
              <DeliveryWorkbench />
            ) : (
              <UnavailableWorkbenchSurface surface={surface} />
            )),
        }))}
      />
    </section>
  );
}
