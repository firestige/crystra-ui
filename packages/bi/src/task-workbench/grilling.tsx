import { useState } from "react";
import {
  WorkbenchSummaryCard,
  Chip,
  EmptyState,
  FullBenchViewer,
  Typography,
} from "../public";
import "./grilling.css";
export interface GrillingProjection {
  revision: string;
  overview?: {
    round: number;
    known: number;
    resolved: number;
    unanswered: number;
    conditional: number;
    remainingTopics: number;
    budget: number;
  };
  topics?: {
    id: string;
    title: string;
    status: "resolved" | "active" | "pending" | "added";
    resolved?: number;
    total?: number;
    reason?: string;
    source?: string;
  }[];
  fields?: {
    id: string;
    title: string;
    text: string;
    status: "confirmed" | "inferred" | "excluded" | "unresolved" | "missing";
  }[];
  changes?: {
    id: string;
    kind: "added" | "removed" | "conflict";
    text: string;
    authority: "confirmed" | "inferred";
  }[];
}
const topicStates = {
  resolved: "已解决",
  active: "待回答",
  pending: "尚未回答",
  added: "新增",
} as const;
const fieldStates = {
  confirmed: "已确认",
  inferred: "AI 推测",
  excluded: "已排除",
  unresolved: "未解决",
  missing: "缺失",
} as const;
const tones = {
  confirmed: "success",
  inferred: "primary",
  excluded: "neutral",
  unresolved: "warning",
  missing: "danger",
  resolved: "success",
  active: "primary",
  pending: "neutral",
  added: "warning",
} as const;
export function GrillingOverview({
  overview,
}: {
  overview?: GrillingProjection["overview"];
}) {
  return (
    <WorkbenchSummaryCard
      data-section-id="grilling-overview"
      icon="help"
      tone={overview ? "primary" : "neutral"}
      title={`需求澄清${overview ? ` · 第 ${overview.round} 轮` : ""}`}
      description={
        overview
          ? `${overview.known} 个已知问题 · ${overview.resolved} 个已解决 · ${overview.unanswered} 个待回答 · ${overview.conditional} 个条件问题`
          : "问题覆盖信息尚不可用"
      }
      facts={
        overview
          ? [
              { label: "剩余主题", value: overview.remainingTopics },
              { label: "问题预算", value: overview.budget },
            ]
          : []
      }
    />
  );
}

function QuestionTopics({ topics }: { topics?: GrillingProjection["topics"] }) {
  if (!topics) return <EmptyState label="问题与来源尚不可用" />;
  if (!topics.length) return <EmptyState label="尚无问题" />;
  return (
    <div className="crystra-grilling-stack">
      {topics.map((topic) => (
        <div key={topic.id}>
          <div className="crystra-grilling-row" data-state={topic.status}>
            <Typography variant="body-compact">{topic.title}</Typography>
            <span className="crystra-grilling-row-meta">
              <Chip tone={tones[topic.status]}>
                {topicStates[topic.status]}
              </Chip>
              {topic.resolved !== undefined && topic.total !== undefined && (
                <Typography variant="meta" tone="muted">
                  {topic.resolved}/{topic.total}
                </Typography>
              )}
            </span>
          </div>
          {topic.status === "added" && (
            <div className="crystra-grilling-reason">
              <Typography as="p" variant="item-title">
                为何新增这个问题？
              </Typography>
              <Typography as="p" variant="description" tone="secondary">
                {topic.reason ?? "新增原因尚不可用"}
              </Typography>
              <Typography as="p" variant="meta" tone="muted">
                来源：{topic.source ?? "尚不可定位"}
              </Typography>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
function BriefContent({
  data,
  compact = false,
}: {
  data?: GrillingProjection;
  compact?: boolean;
}) {
  const fields = compact ? data?.fields?.slice(0, 6) : data?.fields;
  const changes = compact ? data?.changes?.slice(0, 2) : data?.changes;
  return (
    <div className="crystra-grilling-stack">
      {!fields ? (
        <EmptyState label="目标、约束与未解问题尚不可用" />
      ) : !fields.length ? (
        <EmptyState label="尚无实时简报" />
      ) : (
        fields.map((field) => (
          <article
            className="crystra-grilling-field"
            data-state={field.status}
            key={field.id}
          >
            <div className="crystra-grilling-field-heading">
              <Typography as="h4" variant="item-title">
                {field.title}
              </Typography>
              <Chip tone={tones[field.status]}>
                {fieldStates[field.status]}
              </Chip>
            </div>
            <Typography as="p" variant="body-compact" tone="secondary">
              {field.text}
            </Typography>
          </article>
        ))
      )}
      {compact && (data?.fields?.length ?? 0) > 6 && (
        <Typography variant="meta" tone="muted">
          更多字段请展开查看
        </Typography>
      )}
      <section
        className="crystra-grilling-changes"
        data-section-id="grilling-brief-changes"
      >
        <Typography as="h4" variant="item-title">
          本轮变更
        </Typography>
        {!changes ? (
          <Typography as="p" variant="description" tone="muted">
            Brief 版本变化尚不可用
          </Typography>
        ) : !changes.length ? (
          <Typography as="p" variant="description" tone="muted">
            本轮无变更
          </Typography>
        ) : (
          changes.map((change) => (
            <div
              key={change.id}
              className="crystra-grilling-change"
              data-kind={change.kind}
            >
              <Typography variant="body-compact">
                {change.kind === "added"
                  ? "+"
                  : change.kind === "removed"
                    ? "−"
                    : "!"}{" "}
                {change.text}
              </Typography>
              <Chip
                tone={change.authority === "confirmed" ? "success" : "neutral"}
              >
                {change.authority === "confirmed" ? "用户已确认" : "AI 推测"}
              </Chip>
            </div>
          ))
        )}
        {compact && (data?.changes?.length ?? 0) > 2 && (
          <Typography variant="meta" tone="muted">
            更多变更请展开查看
          </Typography>
        )}
      </section>
    </div>
  );
}
export function GrillingWorkbench({ data }: { data?: GrillingProjection }) {
  const [expanded, setExpanded] = useState<"questions" | "brief" | null>(null);
  return (
    <section
      className="crystra-grilling"
      data-section-id="grilling-workbench"
      data-control-surface="grilling"
      data-expanded={expanded ?? undefined}
      data-revision={data?.revision}
    >
      <div hidden={expanded !== null}>
        <GrillingOverview overview={data?.overview} />
      </div>
      <div className="crystra-grilling-columns">
        <section
          role="region"
          aria-label="问题地图"
          className="crystra-grilling-card"
          data-section-id="grilling-question-map"
          hidden={expanded === "brief"}
        >
          <FullBenchViewer
            title="问题地图"
            expanded={expanded === "questions"}
            onExpandedChange={(value) =>
              setExpanded(value ? "questions" : null)
            }
            preview={<QuestionTopics topics={data?.topics?.slice(0, 5)} />}
          >
            <QuestionTopics topics={data?.topics} />
          </FullBenchViewer>
        </section>
        <section
          role="region"
          aria-label="实时简报"
          className="crystra-grilling-card"
          data-section-id="grilling-live-brief"
          hidden={expanded === "questions"}
        >
          <FullBenchViewer
            title="实时简报"
            expanded={expanded === "brief"}
            onExpandedChange={(value) => setExpanded(value ? "brief" : null)}
            preview={<BriefContent data={data} />}
          >
            <BriefContent data={data} />
          </FullBenchViewer>
        </section>
      </div>
    </section>
  );
}
