/** Candidate semantic authoring IR, not the executable Workflow DSL. No geometry fields. */
export type MapKind =
  "start" | "end" | "activity" | "decision" | "fork" | "join" | "group";
export type MapNode = {
  id: string;
  kind: MapKind;
  title: string;
  parent?: string;
  description?: string;
  inputs?: string[];
  outputs?: string[];
  resources?: string[];
  join?: "all" | "any";
  outcome?: "completed" | "terminated";
};
export type FlowIntent = "expected" | "rework" | "recovery" | "exit";
export type MapEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  summaryLabel?: string;
  kind?: "control" | "material";
  intent?: FlowIntent;
  trigger?: string;
  layoutRole?: "advance" | "return";
};
export type WorkflowMapIR = {
  version: "0.2";
  title: string;
  description?: string;
  nodes: MapNode[];
  edges: MapEdge[];
};
export type MapIssue = {
  code: string;
  path: string;
  message: string;
  severity: "blocking" | "warning";
  nodeId?: string;
  edgeId?: string;
};
export type MapParse =
  | { ok: false; errors: MapIssue[] }
  | { ok: true; ir: WorkflowMapIR; issues: MapIssue[] };
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && !!v.trim();
export function parseWorkflowMap(value: unknown): MapParse {
  const errors: MapIssue[] = [];
  const fail = (path: string, message: string) =>
    errors.push({
      code: "INVALID_STRUCTURE",
      path,
      message,
      severity: "blocking",
    });
  if (!object(value))
    return {
      ok: false,
      errors: [
        {
          code: "INVALID_JSON_OBJECT",
          path: "$",
          message: "工作流需要是一个 JSON 对象。",
          severity: "blocking",
        },
      ],
    };
  if (value.version !== "0.2") fail("$.version", "不支持此 JSONIR 版本。");
  if (!text(value.title)) fail("$.title", "请提供工作流名称。");
  if (!Array.isArray(value.nodes) || !Array.isArray(value.edges))
    return {
      ok: false,
      errors: [
        ...errors,
        {
          code: "INVALID_COLLECTION",
          path: "$",
          message: "活动与连线必须是数组。",
          severity: "blocking",
        },
      ],
    };
  if (value.nodes.length > 400 || value.edges.length > 1000)
    fail("$", "本版预览上限为 400 个活动、1000 条连线。");
  const known = (v: Record<string, unknown>, keys: string[], path: string) => {
    for (const key of Object.keys(v))
      if (!keys.includes(key))
        fail(path + "." + key, "未定义字段；布局坐标与样式由引擎负责。");
  };
  known(value, ["version", "title", "description", "nodes", "edges"], "$");
  if (value.description !== undefined && typeof value.description !== "string")
    fail("$.description", "描述必须是文字。");
  const ids = new Set<string>();
  value.nodes.forEach((n, i) => {
    const path = `$.nodes[${i}]`;
    if (!object(n)) {
      fail(path, "活动必须是对象。");
      return;
    }
    known(
      n,
      [
        "id",
        "kind",
        "title",
        "parent",
        "description",
        "inputs",
        "outputs",
        "resources",
        "join",
        "outcome",
      ],
      path,
    );
    if (!text(n.id) || n.id === "$root" || ids.has(n.id))
      fail(path + ".id", "活动身份缺失或重复。");
    else ids.add(n.id);
    if (
      ![
        "start",
        "end",
        "activity",
        "decision",
        "fork",
        "join",
        "group",
      ].includes(String(n.kind))
    )
      fail(path + ".kind", "未知活动类型。");
    if (!text(n.title)) fail(path + ".title", "活动名称不能为空。");
    for (const field of ["parent", "description"])
      if (n[field] !== undefined && typeof n[field] !== "string")
        fail(path + "." + field, "必须是文字。");
    for (const field of ["inputs", "outputs", "resources"])
      if (
        n[field] !== undefined &&
        (!Array.isArray(n[field]) || !n[field].every(text))
      )
        fail(path + "." + field, "必须是非空文字组成的数组。");
    if (
      n.outcome !== undefined &&
      (n.kind !== "end" ||
        !["completed", "terminated"].includes(String(n.outcome)))
    )
      fail(
        path + ".outcome",
        "结束结果仅适用于终点，取值为 completed 或 terminated。",
      );
    if (
      n.join !== undefined &&
      (!["all", "any"].includes(String(n.join)) || n.kind !== "join")
    )
      fail(path + ".join", "汇合规则仅适用于汇合节点。");
  });
  const edgeIds = new Set<string>();
  value.edges.forEach((e, i) => {
    const p = `$.edges[${i}]`;
    if (!object(e)) {
      fail(p, "连线必须是对象。");
      return;
    }
    known(
      e,
      [
        "id",
        "from",
        "to",
        "label",
        "summaryLabel",
        "kind",
        "intent",
        "trigger",
        "layoutRole",
      ],
      p,
    );
    if (!text(e.id) || edgeIds.has(e.id))
      fail(p + ".id", "连线身份缺失或重复。");
    else edgeIds.add(e.id);
    if (!text(e.from) || !ids.has(e.from) || !text(e.to) || !ids.has(e.to))
      fail(p, "连线引用了不存在的活动。");
    if (e.summaryLabel !== undefined && !text(e.summaryLabel))
      fail(p + ".summaryLabel", "阶段结果说明必须是非空文字。");
    if (e.label !== undefined && typeof e.label !== "string")
      fail(p + ".label", "条件必须是文字。");
    if (
      e.intent !== undefined &&
      (!["expected", "rework", "recovery", "exit"].includes(String(e.intent)) ||
        e.kind === "material")
    )
      fail(p + ".intent", "流程意图仅适用于控制流，且必须是已定义类型。");
    if (
      e.layoutRole !== undefined &&
      !["advance", "return"].includes(String(e.layoutRole))
    )
      fail(p + ".layoutRole", "布局角色必须是 advance 或 return。");
    if (e.trigger !== undefined && !text(e.trigger))
      fail(p + ".trigger", "触发条件必须是非空文字。");
    if (
      e.kind !== undefined &&
      !["control", "material"].includes(String(e.kind))
    )
      fail(p + ".kind", "未知关系类型。");
  });
  if (errors.length) return { ok: false, errors };
  const ir = JSON.parse(JSON.stringify(value)) as WorkflowMapIR,
    byId = new Map(ir.nodes.map((n) => [n.id, n]));
  for (const n of ir.nodes) {
    if (n.parent && byId.get(n.parent)?.kind !== "group")
      fail("nodes." + n.id + ".parent", "上层活动不存在或不支持展开。");
    const seen = new Set([n.id]);
    let parent = n.parent;
    while (parent) {
      if (seen.has(parent)) {
        fail("nodes." + n.id + ".parent", "活动层级形成循环。");
        break;
      }
      seen.add(parent);
      parent = byId.get(parent)?.parent;
    }
  }
  for (const e of ir.edges)
    if (byId.get(e.from)?.kind === "group" || byId.get(e.to)?.kind === "group")
      fail(
        "edges." + e.id,
        "连线必须指向内部明确活动；折叠时引擎会汇总到上层。",
      );
  if (errors.length) return { ok: false, errors };
  const issues: MapIssue[] = [];
  const issue = (
    code: string,
    message: string,
    nodeId?: string,
    edgeId?: string,
    severity: "blocking" | "warning" = "blocking",
  ) =>
    issues.push({
      code,
      message,
      nodeId,
      edgeId,
      severity,
      path: nodeId ? "nodes." + nodeId : edgeId ? "edges." + edgeId : "$",
    });
  const control = ir.edges.filter((e) => e.kind !== "material"),
    starts = ir.nodes.filter((n) => n.kind === "start"),
    ends = ir.nodes.filter((n) => n.kind === "end");
  if (starts.length !== 1) issue("START_COUNT", "需要明确唯一的流程起点。");
  if (!ends.length) issue("NO_END", "还没有定义完成或退出位置。");
  const reachable = new Set<string>(starts.map((n) => n.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const e of control)
      if (reachable.has(e.from) && !reachable.has(e.to)) {
        reachable.add(e.to);
        changed = true;
      }
  }
  const canEnd = new Set(ends.map((n) => n.id));
  changed = true;
  while (changed) {
    changed = false;
    for (const e of control)
      if (canEnd.has(e.to) && !canEnd.has(e.from)) {
        canEnd.add(e.from);
        changed = true;
      }
  }
  for (const n of ir.nodes) {
    const outgoing = control.filter((e) => e.from === n.id),
      incoming = control.filter((e) => e.to === n.id);
    if (n.kind === "group") {
      if (!ir.nodes.some((c) => c.parent === n.id))
        issue("EMPTY_GROUP", "这个活动还没有内部流程。", n.id);
      continue;
    }
    if (!reachable.has(n.id))
      issue("UNREACHABLE", "没有路径可以到达这个活动。", n.id);
    if (!canEnd.has(n.id))
      issue("NO_COMPLETION_PATH", "这段流程还没有通向完成或退出的路径。", n.id);
    if (n.kind === "end" && outgoing.length)
      issue("END_HAS_SUCCESSOR", "完成位置之后仍有后续活动。", n.id);
    if (
      n.kind === "decision" &&
      (outgoing.length < 2 || outgoing.some((e) => !e.label?.trim()))
    )
      issue("INCOMPLETE_DECISION", "请说明各个判断结果分别去哪里。", n.id);
    if (n.kind === "fork" && outgoing.length < 2)
      issue("INCOMPLETE_FORK", "并行活动需要至少两条分支。", n.id);
    if (n.kind === "join" && (incoming.length < 2 || !n.join))
      issue(
        "INCOMPLETE_JOIN",
        "请明确等待哪些分支，以及全部还是任一完成后继续。",
        n.id,
      );
    if (n.kind === "activity" && outgoing.length > 1)
      issue("AMBIGUOUS_SPLIT", "多个后续活动是并行还是条件选择？", n.id);
  }
  for (const e of control) {
    if (!e.intent)
      issue(
        "UNCLASSIFIED_FLOW",
        "这条关系尚未说明是预期推进、返工、恢复还是退出。",
        undefined,
        e.id,
        "warning",
      );
    else if (e.intent !== "expected" && !e.trigger?.trim())
      issue("MISSING_TRIGGER", "保障路径需要说明何时触发。", undefined, e.id);
  }
  if (
    control.length &&
    control.every((e) => e.intent) &&
    starts.length === 1 &&
    ends.length
  ) {
    const expected = new Set(starts.map((n) => n.id));
    let growing = true;
    while (growing) {
      growing = false;
      for (const e of control)
        if (
          e.intent === "expected" &&
          expected.has(e.from) &&
          !expected.has(e.to)
        ) {
          expected.add(e.to);
          growing = true;
        }
    }
    if (!ends.some((n) => expected.has(n.id)))
      issue("NO_EXPECTED_COMPLETION", "已分类的预期流程没有通向结束的路径。");
  }
  return { ok: true, ir, issues };
}
export function mapAncestors(ir: WorkflowMapIR, id: string): string[] {
  const result: string[] = [];
  let p = ir.nodes.find((n) => n.id === id)?.parent;
  while (p) {
    result.unshift(p);
    p = ir.nodes.find((n) => n.id === p)?.parent;
  }
  return result;
}
/** Collapsing is a projection: stable original edge IDs and endpoints are retained. */
export function projectWorkflowMap(
  ir: WorkflowMapIR,
  expanded: ReadonlySet<string>,
) {
  const representative = (id: string) =>
    mapAncestors(ir, id).find((parent) => !expanded.has(parent)) || id;
  const nodes = ir.nodes
    .filter((n) => representative(n.id) === n.id)
    .map((n) => ({
      ...n,
      expanded: n.kind === "group" && expanded.has(n.id),
      hiddenCount: ir.nodes.filter((child) =>
        mapAncestors(ir, child.id).includes(n.id),
      ).length,
    }));
  const edges = ir.edges
    .map((e) => ({
      ...e,
      ...((representative(e.from) !== e.from ||
        representative(e.to) !== e.to) &&
      e.summaryLabel
        ? { label: e.summaryLabel }
        : {}),
      originalFrom: e.from,
      originalTo: e.to,
      from: representative(e.from),
      to: representative(e.to),
    }))
    .filter((e) => e.from !== e.to || e.originalFrom === e.originalTo);
  return { nodes, edges };
}
