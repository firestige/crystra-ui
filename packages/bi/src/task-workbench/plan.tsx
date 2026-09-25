import { PlanMarkdown } from "./plan-markdown";
import { useState, type ReactNode } from "react";
import {
  Button,
  Card,
  WorkbenchSummaryCard,
  type SemanticTone,
  Chip,
  EmptyState,
  FullBenchViewer,
  Typography,
} from "../public";
import "./plan.css";
export interface PlanProjection {
  revision: string;
  status: string;
  summaryTone?: SemanticTone;
  source?: string;
  goal?: string;
  criteria?: string[];
  excluded?: string[];
  previousApprovedRevision?: string;
  readiness?: Partial<
    Record<
      "control" | "proof" | "context",
      {
        status: string;
        tone: "neutral" | "success" | "warning";
        items: { label: string; value: string }[];
      }
    >
  >;
  attention?: string[];
  changes?: string[];
  document?: { id: string; title: string; content: string; depth?: number }[];
}
function TextList({
  items,
  unavailable,
}: {
  items?: string[];
  unavailable: string;
}) {
  if (!items) return <EmptyState label={unavailable} />;
  if (!items.length)
    return (
      <Typography as="p" variant="description" tone="muted">
        暂无条目
      </Typography>
    );
  return (
    <ul className="crystra-plan-list">
      {items.map((text, i) => (
        <li key={i}>
          <Typography variant="body-compact">{text}</Typography>
        </li>
      ))}
    </ul>
  );
}
/** One revision per view. Graphs are read-only projection slots, not inferred Workflow runs. */
export function PlanWorkbench({
  data,
  summaryGraph,
  fullGraph,
}: {
  data?: PlanProjection;
  summaryGraph?: ReactNode;
  fullGraph?: ReactNode;
}) {
  const [mode, setMode] = useState<"summary" | "document" | "dag">("summary");
  const [expanded, setExpanded] = useState<"attention" | "changes" | null>(
    null,
  );
  const [chapter, setChapter] = useState<string | null>(null);
  const documentSection =
    data?.document?.find((s) => s.id === chapter) ?? data?.document?.[0];
  const readiness = [
    ["control", "控制边界", "plan-control-envelope-summary"],
    ["proof", "证明准备度", "plan-proof-readiness"],
    ["context", "权威上下文", "plan-context-health"],
  ] as const;
  return (
    <section
      className="crystra-plan"
      data-control-surface="plan"
      data-section-id="plan-workbench"
      data-revision={data?.revision}
      data-full={mode !== "summary" || expanded !== null}
    >
      <div
        hidden={mode !== "summary"}
        className="crystra-plan-summary"
        data-section-id="plan-summary"
      >
        <div hidden={expanded !== null} className="crystra-plan-summary">
          <WorkbenchSummaryCard
            data-section-id="plan-overview"
            icon="command"
            tone={data ? (data.summaryTone ?? "primary") : "neutral"}
            notices={[
              ...(data?.changes
                ? [
                    {
                      text: `${data.changes.length} 项变更`,
                      tone: "primary" as const,
                    },
                  ]
                : []),
              ...(data?.attention
                ? [
                    {
                      text: `${data.attention.length} 项关注`,
                      tone: "warning" as const,
                    },
                  ]
                : []),
            ]}
            title={data ? `计划 ${data.revision} · ${data.status}` : "计划"}
            description="这条路径是否可信，并可授权进行自治执行？"
            actions={
              <Button
                disabled={!data?.document}
                onClick={() => setMode("document")}
              >
                查看完整计划
              </Button>
            }
          />
          <div className="crystra-plan-main-grid">
            <Card
              heading="目标与完成判定"
              data-section-id="plan-outcome-summary"
            >
              {data?.goal ? (
                <Typography as="p" variant="body">
                  {data.goal}
                </Typography>
              ) : (
                <EmptyState
                  label={data ? "目标摘要尚未提供" : "计划版本尚不可用"}
                />
              )}
              <div className="crystra-plan-outcomes">
                <section>
                  <Typography as="h4" variant="item-title">
                    完成标准
                  </Typography>
                  <TextList
                    items={data?.criteria}
                    unavailable="完成标准尚不可用"
                  />
                </section>
                <section>
                  <Typography as="h4" variant="item-title">
                    非目标
                  </Typography>
                  <TextList
                    items={data?.excluded}
                    unavailable="非目标尚不可用"
                  />
                </section>
              </div>
            </Card>
            <Card
              heading="当前计划结构"
              description={data ? `Task Plan ${data.revision}` : undefined}
              data-section-id="plan-dag-projection"
              actions={
                <Button
                  disabled={!data || !fullGraph}
                  onClick={() => setMode("dag")}
                >
                  查看完整 DAG
                </Button>
              }
            >
              {summaryGraph ?? <EmptyState label="计划 DAG 尚不可用" />}
            </Card>
          </div>
          <div
            className="crystra-plan-readiness"
            data-section-id="plan-readiness-summaries"
          >
            {readiness.map(([key, title, id]) => {
              const item = data?.readiness?.[key];
              return (
                <Card
                  key={key}
                  heading={title}
                  data-section-id={id}
                  actions={item && <Chip tone={item.tone}>{item.status}</Chip>}
                >
                  {item ? (
                    <dl className="crystra-plan-facts">
                      {item.items.map((fact, i) => (
                        <div key={i}>
                          <dt>{fact.label}</dt>
                          <dd>{fact.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <EmptyState label={`${title}尚不可用`} />
                  )}
                </Card>
              );
            })}
          </div>
        </div>
        <div
          className="crystra-plan-review-grid"
          data-expanded={expanded ?? undefined}
        >
          <div
            hidden={expanded === "changes"}
            data-section-id="plan-attention-summary"
          >
            <FullBenchViewer
              title="需要关注"
              expanded={expanded === "attention"}
              onExpandedChange={(v) => setExpanded(v ? "attention" : null)}
              preview={
                <TextList
                  items={data?.attention?.slice(0, 3)}
                  unavailable="关注项尚不可用"
                />
              }
            >
              <TextList items={data?.attention} unavailable="关注项尚不可用" />
            </FullBenchViewer>
          </div>
          <div
            hidden={expanded === "attention"}
            data-section-id="plan-change-summary"
          >
            <FullBenchViewer
              title={
                data?.previousApprovedRevision
                  ? `相较 ${data.previousApprovedRevision} 的变更`
                  : "计划变更"
              }
              expanded={expanded === "changes"}
              onExpandedChange={(v) => setExpanded(v ? "changes" : null)}
              preview={
                <TextList
                  items={data?.changes?.slice(0, 3)}
                  unavailable="版本变更尚不可用"
                />
              }
            >
              <TextList items={data?.changes} unavailable="版本变更尚不可用" />
            </FullBenchViewer>
          </div>
        </div>
      </div>
      <div
        hidden={mode !== "document"}
        className="crystra-plan-full"
        data-section-id="plan-document-viewer"
      >
        <Card
          heading={`完整计划 · ${data?.revision ?? "不可用"}`}
          description={data?.source}
          actions={
            <Button onClick={() => setMode("summary")}>返回计划摘要</Button>
          }
        >
          <div className="crystra-plan-document">
            <nav aria-label="计划章节">
              {data?.document?.map((section) => (
                <Button
                  key={section.id}
                  style={{ marginInlineStart: (section.depth ?? 0) * 12 }}
                  appearance="ghost"
                  selected={documentSection?.id === section.id}
                  onClick={() => setChapter(section.id)}
                >
                  {section.title}
                </Button>
              ))}
              <Button disabled={!fullGraph} onClick={() => setMode("dag")}>
                DAG 章节
              </Button>
            </nav>
            <article>
              {documentSection ? (
                <>
                  <Typography as="h3" variant="section-title">
                    {documentSection.title}
                  </Typography>
                  <PlanMarkdown source={documentSection.content} />
                </>
              ) : (
                <EmptyState label="当前版本正文尚不可用" />
              )}
            </article>
          </div>
        </Card>
      </div>
      <div
        hidden={mode !== "dag"}
        className="crystra-plan-full"
        data-section-id="plan-full-dag"
      >
        <Card
          heading={`完整 DAG · ${data?.revision ?? "不可用"}`}
          actions={
            <>
              <Button
                disabled={!data?.document}
                onClick={() => setMode("document")}
              >
                返回计划正文
              </Button>
              <Button onClick={() => setMode("summary")}>返回计划摘要</Button>
            </>
          }
        >
          {fullGraph ?? <EmptyState label="当前版本完整 DAG 尚不可用" />}
        </Card>
      </div>
    </section>
  );
}
