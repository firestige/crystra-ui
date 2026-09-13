import { URL } from "node:url";
import console from "node:console";
import { readFileSync, writeFileSync } from "node:fs";
import { layoutActivityFlow } from "../packages/bi/src/domain/workflow-activity-layout.ts";
const base = new URL("../packages/bi/src/domain/", import.meta.url);
const layouts = { COMPACT: {}, RIGHT: {}, DOWN: {} };
for (const file of [
  "workflow-activity-ir.example.json",
  "workflow-activity-ir.simple.json",
]) {
  const ir = JSON.parse(readFileSync(new URL(file, base), "utf8"));
  for (const flow of ir.flows)
    for (const direction of ["COMPACT", "RIGHT", "DOWN"])
      layouts[direction][flow.id] = await layoutActivityFlow(
        ir,
        flow.id,
        direction,
      );
}
writeFileSync(
  new URL("workflow-activity-layouts.json", base),
  JSON.stringify(layouts, null, 2) + "\n",
);
console.log("Generated 12 ELK orthogonal layouts.");
