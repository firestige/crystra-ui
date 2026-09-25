import { useState } from "react";
import {
  Button,
  Icon,
  type IconName,
  Card,
  Chip,
  EmptyState,
  Typography,
  WorkbenchSummaryCard,
} from "../public";
import { ReviewResourceViewer, type ReviewResource } from "./review-resource";
import "./review-delivery.css";
const evidenceIcons: Record<string, IconName> = {
  计划上下文: "git-branch",
  触发事实: "activity",
  拟议变更: "file",
  验证结果: "check",
  既有决定: "receipt",
};
function EvidenceThumbnail({ url, icon }: { url?: string; icon: IconName }) {
  const [failed, setFailed] = useState(false);
  return url && !failed ? (
    <img src={url} alt="" onError={() => setFailed(true)} />
  ) : (
    <Icon name={icon} size="context-marker" />
  );
}
export interface GateProjection {
  revision: string;
  items: {
    id: string;
    revision: string;
    question: string;
    location: string;
    trigger: string;
    impact: string;
    confirmed: {
      id: string;
      quote: string;
      scope: string;
      receipt: ReviewResource;
    }[];
    interpretation: string;
    delta: string[];
    effects: string[];
    boundaries: string[];
    evidence: { kind: string; resource: ReviewResource }[];
  }[];
}
export function GateWorkbench({
  data,
  selectedId,
  onSelect,
}: {
  data?: GateProjection;
  selectedId?: string | null;
  onSelect?: (id: string, revision: string) => void;
}) {
  const gate =
    data?.items.find((g) => g.id === selectedId) ??
    (selectedId ? undefined : data?.items[0]);
  return (
    <GateView
      key={JSON.stringify([data?.revision, gate?.id, gate?.revision])}
      data={data}
      gate={gate}
      onSelect={onSelect}
    />
  );
}
function GateView({
  data,
  gate,
  onSelect,
}: {
  data?: GateProjection;
  gate?: GateProjection["items"][number];
  onSelect?: (id: string, revision: string) => void;
}) {
  const [queue, setQueue] = useState(false),
    [resource, setResource] = useState<ReviewResource | null>(null);
  return (
    <section
      className="crystra-review-workbench"
      data-section-id="gate-workbench"
    >
      <div hidden={!!resource}>
        <WorkbenchSummaryCard
          icon="shield-lock"
          tone={gate ? "warning" : "neutral"}
          title={
            gate
              ? gate.question
              : data?.items.length === 0
                ? "没有待裁决内容"
                : "当前审核"
          }
          description={
            gate
              ? `${gate.location} · ${gate.trigger}`
              : !data
                ? "审核信息尚不可用"
                : data.items.length
                  ? "所选 Gate 已不在当前待决队列"
                  : "当前无需额外裁决；不代表 Task 已结束。"
          }
          facts={
            gate
              ? [
                  { label: "控制影响", value: gate.impact },
                  { label: "版本", value: gate.revision },
                ]
              : undefined
          }
          actions={
            data && (
              <Button aria-expanded={queue} onClick={() => setQueue(!queue)}>
                待决队列 · {data.items.length}
              </Button>
            )
          }
        />
        {queue && (
          <Card heading="待决队列" description="按宿主提供的优先顺序排列">
            {data?.items.map((g) => (
              <Button
                key={g.id}
                selected={gate?.id === g.id}
                disabled={!onSelect}
                onClick={() => onSelect?.(g.id, g.revision)}
              >
                {g.question}
              </Button>
            ))}
          </Card>
        )}
        {gate && (
          <>
            <Typography as="p" variant="description">
              请在 Input 中讨论并作出决定；此处仅展示当前审核上下文。
            </Typography>
            <Card heading="当前决策状态" data-section-id="gate-decision-board">
              <div className="crystra-gate-grid">
                <div>
                  <section data-section-id="gate-relevant-decisions">
                    <Typography as="h4" variant="item-title">
                      已确认决定
                    </Typography>
                    {gate.confirmed.length ? (
                      gate.confirmed.map((d) => (
                        <div className="crystra-review-item" key={d.id}>
                          <Typography as="p" variant="body">
                            {d.quote}
                          </Typography>
                          <Typography as="p" variant="description">
                            适用范围：{d.scope}
                          </Typography>
                          <Button onClick={() => setResource(d.receipt)}>
                            查看确认记录
                          </Button>
                        </div>
                      ))
                    ) : (
                      <EmptyState label="暂无可核验的相关已确认决定" />
                    )}
                  </section>
                  <section data-section-id="gate-current-interpretation">
                    <Typography as="h4" variant="item-title">
                      AI 当前理解 <Chip tone="primary">候选 · 未授权</Chip>
                    </Typography>
                    <Typography as="p" variant="body">
                      {gate.interpretation}
                    </Typography>
                    <ul>
                      {gate.delta.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </section>
                </div>
                <div>
                  <section data-section-id="gate-execution-preview">
                    <Typography as="h4" variant="item-title">
                      确认后的控制效果
                    </Typography>
                    <ol>
                      {gate.effects.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ol>
                  </section>
                  <section data-section-id="gate-preserved-boundary">
                    <Typography as="h4" variant="item-title">
                      保持不变的边界
                    </Typography>
                    <ul>
                      {gate.boundaries.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            </Card>
            <Card heading="支撑证据" data-section-id="gate-evidence">
              <div className="crystra-review-evidence">
                {gate.evidence.map((e) => (
                  <Button
                    key={e.kind}
                    className="crystra-evidence-tile"
                    appearance="outline"
                    aria-label={e.kind}
                    onClick={() => setResource(e.resource)}
                  >
                    <span
                      className="crystra-evidence-tile-image"
                      aria-hidden="true"
                    >
                      <EvidenceThumbnail
                        key={JSON.stringify([
                          e.resource.id,
                          e.resource.revision,
                          e.resource.thumbnailUrl,
                        ])}
                        url={e.resource.thumbnailUrl}
                        icon={evidenceIcons[e.kind] ?? "file"}
                      />
                    </span>
                    <span className="crystra-evidence-tile-title">
                      {e.kind}
                    </span>
                  </Button>
                ))}
              </div>
            </Card>
          </>
        )}
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
