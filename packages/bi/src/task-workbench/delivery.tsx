import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Typography,
  WorkbenchSummaryCard,
  type SemanticTone,
} from "../public";
import { ReviewResourceViewer, type ReviewResource } from "./review-resource";
import "./review-delivery.css";
export interface DeliveryProjection {
  revision: string;
  status: string;
  tone: SemanticTone;
  invalidated?: boolean;
  source?: string;
  calculatedAt?: string;
  artifacts: { resource: ReviewResource; status: string }[];
  acceptance: {
    id: string;
    claim: string;
    verdict: string;
    tone: SemanticTone;
    evidence?: ReviewResource;
  }[];
  risks: { id: string; text: string; blocking: boolean; gate?: string }[];
  economics: { label: string; value: string }[];
}
export function DeliveryWorkbench({ data }: { data?: DeliveryProjection }) {
  return (
    <DeliveryView
      key={JSON.stringify([data?.revision, data?.invalidated])}
      data={data}
    />
  );
}
function DeliveryView({ data }: { data?: DeliveryProjection }) {
  const [resource, setResource] = useState<ReviewResource | null>(null);
  return (
    <section
      className="crystra-review-workbench"
      data-section-id="delivery-workbench"
    >
      <div hidden={!!resource}>
        <WorkbenchSummaryCard
          data-section-id="delivery-current-readiness"
          icon="check"
          tone={data?.invalidated ? "neutral" : (data?.tone ?? "neutral")}
          title={
            data?.invalidated
              ? "目标已变化 · 待重新计算"
              : (data?.status ?? "当前可交付状态")
          }
          description={
            data
              ? data.invalidated
                ? "此前验收判断已失效，下列内容仅供查看。"
                : `来源：${data.source ?? "未提供"} · 计算时点：${data.calculatedAt ?? "未提供"}`
              : "可交付性尚不可用"
          }
        />
        <Typography as="p" variant="description">
          追加目标、约束或要求 Replan 请回到
          Input；可交付状态将按新要求重新计算。
        </Typography>
        <div className="crystra-delivery-grid">
          <Card heading="当前候选产物" data-section-id="delivery-artifacts">
            {!data ? (
              <EmptyState label="候选产物尚不可用" />
            ) : !data.artifacts.length ? (
              <EmptyState label="暂无候选产物" />
            ) : (
              data.artifacts.map((a) => (
                <div
                  key={`${a.resource.id}:${a.resource.revision}`}
                  className="crystra-review-item"
                >
                  <Typography as="h4" variant="item-title">
                    {a.resource.title}
                  </Typography>
                  <Typography as="p" variant="description">
                    {a.resource.revision} · {a.status}
                  </Typography>
                  <Button onClick={() => setResource(a.resource)}>
                    查看产物
                  </Button>
                </div>
              ))
            )}
          </Card>
          <Card heading="验收覆盖" data-section-id="delivery-acceptance">
            {!data ? (
              <EmptyState label="验收结论与证据尚不可用" />
            ) : !data.acceptance.length ? (
              <EmptyState label="暂无验收记录" />
            ) : (
              data.acceptance.map((a) => (
                <div key={a.id} className="crystra-review-item">
                  <Typography as="p" variant="body">
                    {a.claim}
                  </Typography>
                  <Chip tone={data.invalidated ? "neutral" : a.tone}>
                    {data.invalidated ? "待重新验收" : a.verdict}
                  </Chip>
                  {a.evidence && (
                    <Button onClick={() => setResource(a.evidence!)}>
                      查看证据
                    </Button>
                  )}
                </div>
              ))
            )}
          </Card>
        </div>
        <div className="crystra-delivery-grid">
          <Card heading="剩余风险" data-section-id="delivery-residual-risk">
            {!data ? (
              <EmptyState label="风险及阻断判断尚不可用" />
            ) : !data.risks.length ? (
              <EmptyState label="当前投影未列出风险" />
            ) : (
              data.risks.map((r) => (
                <div key={r.id} className="crystra-review-item">
                  <Chip tone={r.blocking ? "warning" : "neutral"}>
                    {r.blocking ? "阻断交付" : "不阻断交付"}
                  </Chip>
                  <Typography as="p" variant="body">
                    {r.text}
                  </Typography>
                  {r.gate && (
                    <Typography as="p" variant="description">
                      关联待裁决 Gate：{r.gate}
                    </Typography>
                  )}
                </div>
              ))
            )}
          </Card>
          <Card heading="Task 累计投入" data-section-id="delivery-economics">
            {!data ? (
              <EmptyState label="累计投入尚不可用" />
            ) : (
              <dl className="crystra-review-metrics">
                {data.economics.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>
        </div>
      </div>
      {resource && (
        <ReviewResourceViewer
          resource={resource}
          onBack={() => setResource(null)}
        />
      )}
    </section>
  );
}
