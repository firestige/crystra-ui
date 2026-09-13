import { URL } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { layoutActivityFlow } from "../packages/bi/src/domain/workflow-activity-layout.ts";
const base = new URL("../packages/bi/src/domain/", import.meta.url);
const documents = [
  "workflow-activity-ir.example.json",
  "workflow-activity-ir.simple.json",
].map((f) => JSON.parse(readFileSync(new URL(f, base), "utf8")));
for (const ir of documents)
  for (const flow of ir.flows)
    for (const direction of ["RIGHT", "DOWN", "COMPACT"])
      test(
        flow.id + " " + direction + " has orthogonal, unobstructed geometry",
        async () => {
          const before = JSON.stringify(ir),
            layout = await layoutActivityFlow(ir, flow.id, direction);
          assert.equal(JSON.stringify(ir), before);
          assert.equal(layout.engine, "elk-layered");
          assert.equal(layout.routing, "ORTHOGONAL");
          assert.deepEqual(
            Object.keys(layout.nodes).sort(),
            [...flow.nodeIds].sort(),
          );
          assert.deepEqual(
            Object.keys(layout.edges).sort(),
            flow.edges.map((e) => e.id).sort(),
          );
          const boxes = Object.entries(layout.nodes).map(([id, n]) => ({
            id,
            l: n.x - n.width / 2,
            r: n.x + n.width / 2,
            t: n.y - n.height / 2,
            b: n.y + n.height / 2,
          }));
          for (const a of boxes)
            for (const b of boxes)
              if (a.id < b.id)
                assert.ok(
                  a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t,
                  "node overlap " + a.id + " " + b.id,
                );
          for (const [id, edge] of Object.entries(layout.edges)) {
            const semantic = flow.edges.find((e) => e.id === id);
            assert.match(edge.path, /^M/);
            assert.doesNotMatch(edge.path, /[CQSA]/i);
            for (let i = 1; i < edge.points.length; i++) {
              const a = edge.points[i - 1],
                b = edge.points[i];
              assert.ok(
                Math.abs(a.x - b.x) < 0.01 || Math.abs(a.y - b.y) < 0.01,
                "diagonal " + id,
              );
              for (const box of boxes.filter(
                (n) => n.id !== semantic.from && n.id !== semantic.to,
              )) {
                const cuts =
                  Math.abs(a.x - b.x) < 0.01
                    ? a.x > box.l + 0.1 &&
                      a.x < box.r - 0.1 &&
                      Math.max(a.y, b.y) > box.t + 0.1 &&
                      Math.min(a.y, b.y) < box.b - 0.1
                    : a.y > box.t + 0.1 &&
                      a.y < box.b - 0.1 &&
                      Math.max(a.x, b.x) > box.l + 0.1 &&
                      Math.min(a.x, b.x) < box.r - 0.1;
                assert.equal(
                  cuts,
                  false,
                  "edge through node " + id + " " + box.id,
                );
              }
            }
            if (edge.label)
              for (const box of boxes)
                assert.ok(
                  edge.label.x + edge.label.width <= box.l ||
                    edge.label.x >= box.r ||
                    edge.label.y + edge.label.height <= box.t ||
                    edge.label.y >= box.b,
                  "label overlap " + id + " " + box.id,
                );
          }
        },
      );
test("same semantic input produces the same geometry", async () => {
  const ir = documents[0];
  assert.deepEqual(
    await layoutActivityFlow(ir, "main", "RIGHT"),
    await layoutActivityFlow(ir, "main", "RIGHT"),
  );
});

test("compact main uses the available two-dimensional canvas", async () => {
  const layout = await layoutActivityFlow(documents[0], "main", "COMPACT");
  assert.ok(layout.width <= 1750, "main is too wide: " + layout.width);
  assert.ok(layout.height <= 1050, "main is too tall: " + layout.height);
  assert.ok(
    layout.width / layout.height < 2.5,
    "main is still a horizontal strip",
  );
});

test("compact implementation and decision share a column and a straight return connection", async () => {
  const layout = await layoutActivityFlow(documents[0], "ladder", "COMPACT");
  assert.ok(
    Math.abs(layout.nodes.implement.x - layout.nodes["rung-result"].x) < 0.1,
    "related activities are not column-aligned",
  );
  const edge = layout.edges["rung-red"];
  assert.ok(
    edge.points.every(
      (p) => Math.abs(p.x - layout.nodes["rung-result"].x) < 0.1,
    ),
    "return connection has an unnecessary horizontal jog",
  );
});
