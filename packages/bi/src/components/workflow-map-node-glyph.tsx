import type { MapLayout } from "../domain/workflow-map-engine";
import type { MapNode } from "../domain/workflow-map-ir";
/** Shared geometry and typography for Workflow and read-only graph projections. */
export function WorkflowMapNodeGlyph({
  node: n,
  semantic,
  meta,
}: {
  node: MapLayout["nodes"][number];
  semantic: MapNode;
  meta?: string;
}) {
  return (
    <>
      {semantic.kind === "decision" ? (
        <path
          className="map-node-shape"
          d={`M${n.x + n.width / 2} ${n.y}L${n.x + n.width} ${n.y + n.height / 2}L${n.x + n.width / 2} ${n.y + n.height}L${n.x} ${n.y + n.height / 2}Z`}
        />
      ) : semantic.kind === "start" || semantic.kind === "end" ? (
        <>
          <circle
            className="map-node-shape"
            cx={n.x + n.width / 2}
            cy={n.y + n.height / 2}
            r="24"
          />
          {semantic.kind === "end" &&
            (semantic.outcome === "terminated" ? (
              <path
                className="map-terminal-cross"
                d={`M${n.x + 15} ${n.y + 15}l18 18M${n.x + 33} ${n.y + 15}l-18 18`}
              />
            ) : (
              <circle
                className="map-terminal-inner"
                cx={n.x + n.width / 2}
                cy={n.y + n.height / 2}
                r="14"
              />
            ))}
        </>
      ) : (
        <rect
          className="map-node-shape"
          x={n.x}
          y={n.y}
          width={n.width}
          height={n.height}
          rx={semantic.kind === "fork" || semantic.kind === "join" ? 0 : 12}
        />
      )}
      <text
        className="map-node-title"
        style={n.caption ? { fontSize: 17, fontWeight: 400 } : undefined}
        x={n.caption ? n.caption.x + n.caption.width / 2 : n.x + n.width / 2}
        y={
          n.caption
            ? n.caption.y + n.caption.baseline
            : ["start", "end", "fork", "join"].includes(semantic.kind)
              ? n.y + n.height + 24
              : n.y + n.height / 2 + 4
        }
        textAnchor="middle"
      >
        {semantic.title}
      </text>
      {!["start", "end", "fork", "join"].includes(semantic.kind) && (
        <text
          className="map-node-meta"
          x={n.x + n.width / 2}
          y={n.y + 22}
          textAnchor="middle"
        >
          {meta}
        </text>
      )}
    </>
  );
}
