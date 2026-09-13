import { useState } from "react";
import { previewReceipt } from "../preview-fixtures";
import {
  BiCard,
  BiSurface,
  ReceiptView,
  SpanPassport,
  TraceStatistics,
  TraceTree,
  TraceWaterfall,
} from "../public";
import { statisticsTrace } from "../test-harness/statistics-fixture";
import { ExpressionDashboard } from "./expression-dashboard";
import { WidgetExpressionStudy } from "./widget-expression-study";
const sections = [
  {
    id: "expressions",
    title: "表达方式",
    components: "Widget 表达设计",
    note: "按阅读需求选择表达方式；每种提供固定构图、主次与尺寸建议。已确认的表达方式。",
  },

  {
    id: "dashboard",
    title: "Dashboard 与图表",
    components: "DashboardGrid · ExpressionWidget",
    note: "使用已确认表达方式与模拟数据，保留布局编辑；单格160px，跨格包含16px间距。",
  },

  {
    id: "waterfall",
    title: "Trace 瀑布图",
    components: "TraceWaterfall · 内嵌 SpanPassport",
    note: "12 个已记录 span 的仓库测试样本；可搜索、缩放、折叠并检查 span。",
  },
  {
    id: "tree",
    title: "Trace 树图",
    components: "TraceTree · 内嵌 SpanPassport",
    note: "现有 Canvas 树图，支持节点选择、视口移动及祖先/后代观察。它不是 Workflow DAG 设计稿。",
  },
  {
    id: "statistics",
    title: "Trace 统计",
    components: "TraceStatistics",
    note: "现有时长、状态、类型与分组统计；图表保持自身配色。",
  },
  {
    id: "passport",
    title: "Span 与回执详情",
    components: "SpanPassport · ReceiptView",
    note: "单独展开两个详情组件，方便检查信息密度和原有视觉。",
  },
] as const;
export function LibraryPreview() {
  const [page, setPage] = useState<string>("expressions");
  const current = sections.find((x) => x.id === page)!;
  return (
    <div className="library-gallery">
      <header className="library-heading">
        <h1>Crystra-ui · 其余组件全景</h1>
        <p>
          直接渲染库中已实现的 React 组件，使用本地 fixture，无后台连接。Widget
          展示已统一到表达方式，Dashboard 复用同一渲染；专业 Trace 视图保留。
        </p>
        <a href="component-preview.html">查看已接受的基础组件</a>
      </header>
      <nav className="library-navigation" aria-label="组件展示目录">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={page === s.id}
            onClick={() => setPage(s.id)}
          >
            {s.title}
          </button>
        ))}
      </nav>
      <section className="library-description">
        <h2>{current.title}</h2>
        <p>{current.note}</p>
        <code>{current.components}</code>
      </section>
      <BiSurface
        theme="dark"
        data-crystra-theme={
          ["expressions", "dashboard"].includes(page) ? "dark" : undefined
        }
        className={[
          "library-stage",
          ["expressions", "dashboard"].includes(page) ? "monitoring-bi" : "",
        ].join(" ")}
      >
        {page === "expressions" && <WidgetExpressionStudy />}
        {page === "dashboard" && <ExpressionDashboard />}
        {page === "waterfall" && <TraceWaterfall trace={statisticsTrace} />}
        {page === "tree" && <TraceTree trace={statisticsTrace} />}
        {page === "statistics" && <TraceStatistics trace={statisticsTrace} />}
        {page === "passport" && (
          <div className="library-details">
            <BiCard>
              <SpanPassport
                node={statisticsTrace.nodes[3]}
                trace={statisticsTrace}
              />
            </BiCard>
            <BiCard>
              <ReceiptView receipt={previewReceipt} side="single" />
            </BiCard>
          </div>
        )}
      </BiSurface>
      <footer className="library-footer">
        <p>
          范围：public.ts 中前三批以外的可视组件，另含现有内部 DashboardComposer
          / OwnedInspector。纯类型、数据投影函数与产品路由不单独绘制。
        </p>
        <p>
          ResourceGrid、Browser 批量操作、Workflow / Analysis
          工作台等尚未完成的设计，不在这里伪装成已实现组件。原有英文、图形和状态样式保留用于审阅。
        </p>
      </footer>
    </div>
  );
}
