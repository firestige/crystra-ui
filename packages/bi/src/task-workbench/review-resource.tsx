import { Button, Card, EmptyState, Typography } from "../public";
export interface ReviewResource {
  id: string;
  revision: string;
  title: string;
  content?: string;
  thumbnailUrl?: string;
}
/** Exact supplied resource only; missing content never falls back to latest. */
export function ReviewResourceViewer({
  resource,
  onBack,
}: {
  resource: ReviewResource;
  onBack: () => void;
}) {
  return (
    <Card
      className="crystra-review-inspector"
      heading={resource.title}
      description={`${resource.id} · ${resource.revision}`}
      actions={<Button onClick={onBack}>返回</Button>}
    >
      {resource.content ? (
        <Typography as="p" variant="body" className="crystra-review-prose">
          {resource.content}
        </Typography>
      ) : (
        <EmptyState label="该精确版本暂不可读取" />
      )}
    </Card>
  );
}
