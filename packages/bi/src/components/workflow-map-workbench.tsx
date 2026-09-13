import { useLayoutEffect } from "react";
import { WorkflowCrystallization } from "./workflow-crystallization";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Card, Chip, IconButton, Typography } from "./design-system";
import { SearchField, SelectField } from "./state-components";
import { Icon } from "./icon";
import {
  parseWorkflowMap,
  projectWorkflowMap,
  mapAncestors,
  type WorkflowMapIR,
  type MapIssue,
} from "../domain/workflow-map-ir";
import {
  layoutWorkflowMap,
  type MapLayout,
} from "../domain/workflow-map-engine";
import { frameMap, upstreamMap } from "../domain/workflow-map-camera";
import { useWorkflowMapViewport } from "./use-workflow-map-viewport";
import {
  WorkflowMapOutline,
  WorkflowMapMinimap,
} from "./workflow-map-navigation";
import { WidgetTooltip } from "./widget-tooltip";
import mapTokens from "../../../../design/workflow-map.tokens.json";
import development from "../domain/workflow-map-development.json";
import architecture from "../domain/workflow-map-architecture.json";
import research from "../domain/workflow-map-research.json";
import "../workflow-map-workbench.css";
declare global {
  interface Window {
    crystraWorkflowMapCandidate?: {
      samples: WorkflowMapIR[];
      layout: (
        ir: WorkflowMapIR,
        expanded: ReadonlySet<string>,
        direction: string,
      ) => MapLayout | null;
    };
  }
}
const candidatePreview =
  typeof window !== "undefined"
    ? window.crystraWorkflowMapCandidate
    : undefined;
const samples =
  candidatePreview?.samples ||
  ([development, architecture, research] as WorkflowMapIR[]);
const previewLayout = async (
  ir: WorkflowMapIR,
  expanded: ReadonlySet<string>,
  direction: "RIGHT" | "DOWN",
  bounds?: { width: number; height: number },
) => {
  if (candidatePreview) {
    const result = candidatePreview.layout(ir, expanded, direction);
    if (!result)
      throw Error(
        "当前优先候选仅预生成三套样本；修改后的定义需重新运行候选布局生成器。",
      );
    return result;
  }
  return layoutWorkflowMap(ir, expanded, direction, bounds);
};
const kindName = {
  start: "起点",
  end: "完成",
  activity: "活动",
  decision: "判断",
  fork: "并行",
  join: "汇合",
  group: "复合活动",
};
type Message = {
  text: string;
  role: "user" | "assistant" | "system";
  candidate?: WorkflowMapIR;
};
function MapIconButton(props: React.ComponentProps<typeof IconButton>) {
  return (
    <WidgetTooltip
      text={String(props["aria-label"] || "")}
      focusable={!!props.disabled}
      className="map-action-tooltip"
    >
      <IconButton {...props} />
    </WidgetTooltip>
  );
}
export function WorkflowMapWorkbench({
  onIdentity,
  mode,
  onWorkflow,
  requestedNode,
}: {
  onIdentity: (title: string, description: string) => void;
  mode: string;
  onWorkflow?: (ir: WorkflowMapIR) => void;
  requestedNode?: { id: string; seq: number } | null;
}) {
  const [ir, setIR] = useState<WorkflowMapIR>(samples[0]),
    [expanded, setExpanded] = useState<Set<string>>(() => new Set<string>());
  const [layout, setLayout] = useState<MapLayout | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [focus, setFocus] = useState(false),
    [pathMode, setPathMode] = useState<"expected" | "all">("expected"),
    [outlineOpen, setOutlineOpen] = useState(false),
    [headerHost, setHeaderHost] = useState<HTMLElement | null>(null);
  const [direction, setDirection] = useState<"RIGHT" | "DOWN">("RIGHT"),
    [query, setQuery] = useState(""),
    [scope, updateScope] = useState<string | null>(null),
    [focalId, setFocalId] = useState<string | null>(null),
    [cameraRevision, setCameraRevision] = useState(0),
    [bounds, setBounds] = useState({ width: 1000, height: 700 });
  const [panel, setPanel] = useState<"detail" | "issues" | null>(null),
    [feed, setFeed] = useState<HTMLElement | null>(null),
    [messages, setMessages] = useState<Message[]>([
      {
        role: "user",
        text: "根据需求与设计完成开发。细化设计后逐单元进行 TDD，完成后并行复核与验证，发现问题就回去修复。",
      },
      {
        role: "assistant",
        text: "已将意图整理为包含分支、循环和并行关系的工作流。展开或折叠只改变看图方式，所有连线仍指向原来的活动。选择一个活动，就可以继续讨论。",
      },
    ]);
  useEffect(() => {
    const changed = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (
        detail.workspace !==
        window.crystraResourceWorkspaces?.find((w) => w.title === ir.title)
          ?.root
      )
        return;
      setMessages((old) => [
        ...old,
        {
          role: "system",
          text:
            "资源事件（演示，待接入 Agent）：" +
            (
              { add: "新增", rename: "改名", delete: "删除" } as Record<
                string,
                string
              >
            )[detail.operation] +
            "「" +
            detail.name +
            "」。引用检查已通过；尚未通知真实 LLM。",
        },
      ]);
    };
    window.addEventListener("crystra-resource-changed", changed);
    return () =>
      window.removeEventListener("crystra-resource-changed", changed);
  }, [ir.title]);
  const introducedCrystallization = useRef(false);
  useEffect(() => {
    if (mode === "crystallization" && !introducedCrystallization.current) {
      introducedCrystallization.current = true;
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "结晶方案样本：建议将报告提取与校验拆给 Script，将结构化输出交给 Template，异常解释与后续操作仍由 Reviewer 判断。右侧可切换变更前后；不支持的报告格式保留 Agent 恢复路径。这类优化依赖长期重复运行。先看历史占用并预测替代收益，再形成新版本，用正常的费用、Token 和延迟指标比较实测结果；右侧数值仅为设计样本。",
        },
      ]);
    }
  }, [mode]);
  const [candidate, setCandidate] = useState<WorkflowMapIR | null>(null),
    [json, setJson] = useState(""),
    [inputErrors, setInputErrors] = useState<MapIssue[]>([]),
    [snapshot, setSnapshot] = useState<WorkflowMapIR | null>(null),
    [readonly, setReadonly] = useState(false),
    [, setSaved] = useState(false);
  const lab = useRef<HTMLDialogElement>(null),
    publish = useRef<HTMLDialogElement>(null),
    viewport = useRef<HTMLDivElement>(null),
    sendRef = useRef<(text: string) => void>(() => {});
  const focalView = useRef<{ id: string; expanded: Set<string> } | null>(null);
  const [isolate, setIsolate] = useState(false);
  const { camera, moving, move } = useWorkflowMapViewport(viewport, () =>
    setIsolate(false),
  );
  const moveRef = useRef(move);
  useLayoutEffect(() => {
    moveRef.current = move;
  });
  const setScope = (id: string | null) => {
    updateScope(id);
    if (id) setFocalId(id);
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Discover the host header after its parent commits; the portal target does not exist during the initial render.
    setHeaderHost(
      document.querySelector<HTMLElement>(
        '[data-section-id="workspace-header"] [data-header-slot="context"]',
      ),
    );
  }, []);
  const currentIR = readonly && snapshot ? snapshot : candidate || ir;
  useEffect(() => {
    onWorkflow?.(currentIR);
  }, [currentIR, onWorkflow]);
  const parsed = useMemo(() => parseWorkflowMap(currentIR), [currentIR]);
  const issues = parsed.ok ? parsed.issues : parsed.errors;
  const projected = useMemo(
    () => projectWorkflowMap(currentIR, expanded),
    [currentIR, expanded],
  );
  const byId = useMemo(
    () => new Map(currentIR.nodes.map((n) => [n.id, n])),
    [currentIR],
  );
  const current = selected ? byId.get(selected) : undefined;
  const currentEdge = currentIR.edges.find((e) => e.id === selected);
  const breadcrumbNode = current || (scope ? byId.get(scope) : undefined);
  const identityCallback = useRef(onIdentity);
  useLayoutEffect(() => {
    identityCallback.current = onIdentity;
  });
  useEffect(
    () =>
      identityCallback.current(currentIR.title, currentIR.description || ""),
    [currentIR.title, currentIR.description],
  );
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start an asynchronous engine request; pending status belongs to that external lifecycle.
    setBusy(true);
    setError("");
    previewLayout(currentIR, expanded, direction, bounds)
      .then((next) => {
        if (cancelled) return;
        setLayout(next);
        setBusy(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError("布局暂未完成：" + e.message);
        setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentIR, expanded, direction, bounds]);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const obs = new ResizeObserver(
      () =>
        element.clientWidth > 0 &&
        element.clientHeight > 0 &&
        setBounds({ width: element.clientWidth, height: element.clientHeight }),
    );
    obs.observe(element);
    return () => obs.disconnect();
  }, []);
  const scale = camera.scale;
  const setZoom = (value: number | null) => {
    if (value === null) {
      setScope(null);
      setCameraRevision((v) => v + 1);
      return;
    }
    const ratio = value / camera.scale;
    move({
      scale: value,
      x: bounds.width / 2 - (bounds.width / 2 - camera.x) * ratio,
      y: bounds.height / 2 - (bounds.height / 2 - camera.y) * ratio,
    });
  };
  useEffect(() => {
    if (!layout || busy) return;
    const target = scope ? layout.nodes.find((n) => n.id === scope) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- A completed engine layout starts a new camera focus; manual D3 exploration may release it afterward.
    setIsolate(!!target?.expanded);
    if (target && scope)
      focalView.current = { id: scope, expanded: new Set(expanded) };
    let frame = target
      ? { x: target.x, y: target.y, width: target.width, height: target.height }
      : { x: 0, y: 0, width: layout.width, height: layout.height };
    if (target && layout.boundaries) {
      let left = frame.x,
        top = frame.y,
        right = left + frame.width,
        bottom = top + frame.height;
      const measure = document.createElement("canvas").getContext("2d");
      if (measure) measure.font = "14px system-ui";
      for (const b of layout.boundaries.filter((b) => b.group === scope)) {
        const label =
          (b.direction === "in" ? "来自 " : "前往 ") +
          (byId.get(b.external)?.title || "");
        const w = (measure?.measureText(label).width || label.length * 14) + 16;
        left = Math.min(
          left,
          b.x - (b.side === "WEST" ? w + 12 : b.side === "EAST" ? 0 : w / 2),
        );
        right = Math.max(
          right,
          b.x + (b.side === "EAST" ? w + 12 : b.side === "WEST" ? 0 : w / 2),
        );
        top = Math.min(top, b.y - 34);
        bottom = Math.max(bottom, b.y + 34);
      }
      frame = { x: left, y: top, width: right - left, height: bottom - top };
    }
    moveRef.current(frameMap(frame, bounds));
  }, [layout, busy, bounds, scope, cameraRevision, byId, expanded]);
  const inScope = (id: string) =>
    !isolate ||
    !scope ||
    id === scope ||
    mapAncestors(currentIR, id).includes(scope);
  const related = useMemo(() => {
    if (!selected) return new Set<string>();
    const target = currentEdge?.to || selected;
    const upstream = upstreamMap(currentIR, target, pathMode),
      ids = new Set<string>(upstream.nodes);
    for (const id of upstream.nodes)
      for (const ancestor of mapAncestors(currentIR, id)) ids.add(ancestor);
    for (const edge of projected.edges)
      if (upstream.edges.has(edge.id)) {
        ids.add(edge.id);
        ids.add(edge.from);
        ids.add(edge.to);
      }
    return ids;
  }, [selected, currentEdge, projected, currentIR, pathMode]);
  const expectedNodes = useMemo(() => {
    const ids = new Set<string>();
    for (const e of currentIR.edges)
      if (e.kind !== "material" && (!e.intent || e.intent === "expected")) {
        ids.add(e.from);
        ids.add(e.to);
      }
    for (const id of [...ids])
      for (const ancestor of mapAncestors(currentIR, id)) ids.add(ancestor);
    return ids;
  }, [currentIR]);
  const nodeOpacity = (id: string) =>
    focus
      ? related.has(id)
        ? 1
        : 0.2
      : pathMode === "expected" && !expectedNodes.has(id)
        ? 0.65
        : 1;
  const edgeOpacity = (id: string) => {
    const e = currentIR.edges.find((e) => e.id === id);
    return focus
      ? related.has(id)
        ? 1
        : 0.15
      : pathMode === "expected" && e?.intent && e.intent !== "expected"
        ? 0.6
        : 1;
  };
  const load = (next: WorkflowMapIR) => {
    setIR(next);
    setCandidate(null);
    setReadonly(false);
    setSnapshot(null);
    focalView.current = null;
    setFocalId(null);
    setExpanded(new Set());
    setSelected(null);
    setPanel(null);
    setFocus(false);
    setZoom(null);
    setSaved(false);
  };
  const locate = (id: string) => {
    setExpanded((e) => new Set([...e, ...mapAncestors(currentIR, id)]));
    setSelected(id);
    setFocus(true);
    setPanel("detail");
    setQuery("");
    setFocus(true);
    setScope(id);
    setCameraRevision((v) => v + 1);
  };
  useEffect(() => {
    if (!requestedNode) return;
    const id = requestedNode.id;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Consume a navigation request from the host resource view and synchronize the canvas selection.
    setExpanded((e) => new Set([...e, ...mapAncestors(currentIR, id)]));
    setSelected(id);
    setFocus(true);
    setPanel("detail");
    setQuery("");
    updateScope(id);
    setFocalId(id);
    setCameraRevision((v) => v + 1);
  }, [requestedNode, currentIR]);
  const quote = (text: string) => {
    const input = document.querySelector<HTMLTextAreaElement>(
      '[data-host-owned="dsh-input"] textarea',
    );
    if (input) {
      input.value = text;
      input.focus();
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };
  const acceptInput = async () => {
    let value: unknown;
    try {
      value = JSON.parse(json);
    } catch {
      setInputErrors([
        {
          code: "JSON_SYNTAX",
          path: "$",
          message: "JSON 格式不完整，当前图保持不变。",
          severity: "blocking",
        },
      ]);
      return;
    }
    const result = parseWorkflowMap(value);
    if (!result.ok) {
      setInputErrors(result.errors);
      return;
    }
    try {
      await previewLayout(
        result.ir,
        new Set(
          result.ir.nodes.filter((n) => n.kind === "group").map((n) => n.id),
        ),
        direction,
      );
    } catch (e) {
      setInputErrors([
        {
          code: "LAYOUT_REJECTED",
          path: "$",
          message: "该定义暂时无法布局，当前图保持不变：" + String(e),
          severity: "blocking",
        },
      ]);
      return;
    }
    setInputErrors([]);
    load(result.ir);
    lab.current?.close();
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text:
          "已接收新的语义定义，由引擎重新布局。" +
          (result.issues.length
            ? `有 ${result.issues.length} 项待检查，草稿仍可继续设计。`
            : ""),
      },
    ]);
  };
  useLayoutEffect(() => {
    sendRef.current = (text) => {
      setMessages((m) => [...m, { role: "user", text }]);
      if (mode === "crystallization") {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: "已记录这条结晶讨论。当前是本地交互样本，尚未连接 Agent，不会根据这条消息生成脚本或修改候选。可以在右侧检查拆分边界、输入输出和收益假设。",
          },
        ]);
        return;
      }
      if (mode === "resources") {
        window.dispatchEvent(
          new CustomEvent("crystra-resource-message", { detail: { text } }),
        );
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: "已收到资源讨论内容。当前右侧展示工作流包的文件快照；Agent 下载、编辑文件与实时刷新尚未接入，此次没有修改文件。",
          },
        ]);
        return;
      }
      if (readonly) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: "当前查看的是已发布演示版本，请切回草稿继续设计。",
          },
        ]);
        return;
      }
      const rename = text.match(
        /(?:把|将)?[「“"]?(.+?)[」”"]?\s*改名为\s*[「“"]?(.+?)[」”"]?[。！]?$/,
      );
      const target = rename
        ? ir.nodes.find((n) => n.title === rename[1].trim())
        : undefined;
      if (target && rename) {
        const next = structuredClone(ir);
        next.nodes.find((n) => n.id === target.id)!.title = rename[2].trim();
        setCandidate(next);
        locate(target.id);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text:
              "建议将「" +
              target.title +
              "」改为「" +
              rename[2].trim() +
              "」。连线与层级保持不变，请检查图上的候选变化。",
            candidate: next,
          },
        ]);
        return;
      }
      const name = text
        .replace(/^(展开|聚焦|定位)\s*/, "")
        .replace(/[「」“”]/g, "")
        .trim();
      const found = ir.nodes.find((n) => n.title === name);
      if (found && /^(展开|聚焦|定位)/.test(text)) {
        locate(found.id);
        if (text.startsWith("展开") && found.kind === "group")
          setExpanded((e) => new Set([...e, found.id]));
        setFocus(true);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text:
              "已定位「" +
              found.title +
              "」。仅调整观察范围，工作流定义没有改变。",
          },
        ]);
        return;
      }
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "此版的 Agent 适配是本地演示：可以说“展开 活动名称”“聚焦 活动名称”或“把 原名称 改名为 新名称”。任意复杂方案可通过验证台提交 JSONIR；正式自然语言生成尚未连接。",
        },
      ]);
    };
  });
  useEffect(() => {
    const f = document.querySelector<HTMLElement>(
      '[data-section-id="conversation-feed"]',
    );
    if (f) {
      f.replaceChildren();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Clear host placeholder content before mounting the React chat portal into this external node.
      setFeed(f);
    }
    const input = document.querySelector<HTMLTextAreaElement>(
        '[data-host-owned="dsh-input"] textarea',
      ),
      send = document.querySelector('[data-section-id="composer-send"]');
    const submit = (e: Event) => {
      if (!input?.value.trim()) return;
      e.preventDefault();
      e.stopPropagation();
      const text = input.value;
      input.value = "";
      sendRef.current(text);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) submit(e);
    };
    send?.addEventListener("click", submit);
    input?.addEventListener("keydown", key);
    return () => {
      send?.removeEventListener("click", submit);
      input?.removeEventListener("keydown", key);
    };
  }, []);
  useEffect(() => {
    if (feed) feed.scrollTo({ top: feed.scrollHeight });
  }, [messages, feed]);
  useEffect(() => {
    const receive = (event: Event) =>
      setMessages((m) => [
        ...m,
        { role: "assistant", text: String((event as CustomEvent).detail.text) },
      ]);
    window.addEventListener("crystra-studio-chat-note", receive);
    return () =>
      window.removeEventListener("crystra-studio-chat-note", receive);
  }, []);
  const toggle = (id: string) => {
    const closing = expanded.has(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (closing) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelected(null);
    setFocus(false);
    setPanel(null);
    setScope(closing ? byId.get(id)?.parent || null : id);
    setCameraRevision((v) => v + 1);
  };
  const selectNode = (id: string) => {
    setSelected(id);
    setFocus(true);
    setPanel("detail");
    setScope(id);
    setCameraRevision((v) => v + 1);
  };
  const leaveScope = () => {
    if (!scope) return;
    if (expanded.has(scope)) {
      toggle(scope);
      return;
    }
    setSelected(null);
    setPanel(null);
    setFocus(false);
    setScope(byId.get(scope)?.parent || null);
    setCameraRevision((v) => v + 1);
  };
  const nodeIssues = (id: string) =>
    issues.filter(
      (i) =>
        i.nodeId === id ||
        (i.nodeId && mapAncestors(currentIR, i.nodeId).includes(id)),
    );
  const keyboard = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (byId.has(id)) selectNode(id);
      else {
        setSelected(id);
        setFocus(true);
        setPanel("detail");
      }
    }
  };
  const adopt = (next: WorkflowMapIR) => {
    setIR(structuredClone(next));
    setCandidate(null);
    setSaved(false);
    setMessages((m) => [
      ...m,
      { role: "assistant", text: "已采用到草稿。版本发布前仍需检查完整定义。" },
    ]);
  };
  return (
    <div
      className="map-workbench"
      data-crystallization={mode === "crystallization"}
      style={mapTokens.dark as React.CSSProperties}
      data-ui-owner="components"
      data-section-id="workflow-map-workbench"
    >
      {feed &&
        createPortal(
          <div className="map-chat" data-ui-owner="components">
            <div className="map-chat-label">
              <Typography variant="meta" tone="muted">
                工作流对话
              </Typography>
              <Chip>Agent 交互演示</Chip>
            </div>
            {messages.map((m, i) => (
              <article key={i} className={"map-message " + m.role}>
                <Typography as="p" variant="description">
                  {m.text}
                </Typography>
                {m.candidate && (
                  <Button
                    appearance="ghost"
                    disabled={
                      readonly ||
                      JSON.stringify(ir) === JSON.stringify(m.candidate)
                    }
                    onClick={() => adopt(m.candidate!)}
                  >
                    {JSON.stringify(ir) === JSON.stringify(m.candidate)
                      ? "已采用"
                      : "采用建议"}
                  </Button>
                )}
              </article>
            ))}
            <Typography variant="meta" tone="muted">
              选择活动后，可直接引用到输入框继续讨论。
            </Typography>
          </div>,
          feed,
        )}
      {headerHost &&
        mode !== "resources" &&
        mode !== "crystallization" &&
        createPortal(
          <div
            className="map-header-actions crystra-bi"
            data-crystra-theme="dark"
            data-ui-owner="components"
          >
            <div className="map-controls">
              <div>
                <MapIconButton
                  appearance="ghost"
                  aria-label="缩小活动图"
                  onClick={() => setZoom(Math.max(0.1, scale * 0.8))}
                >
                  <Icon name="minus" />
                </MapIconButton>
                <WidgetTooltip
                  text="恢复 100% 缩放"
                  focusable={false}
                  className="map-action-tooltip"
                >
                  <Button
                    appearance="ghost"
                    aria-label="恢复 100% 缩放"
                    onClick={() => setZoom(1)}
                  >
                    {Math.round(scale * 100)}%
                  </Button>
                </WidgetTooltip>
                <MapIconButton
                  appearance="ghost"
                  aria-label="放大活动图"
                  onClick={() => setZoom(Math.min(2, scale * 1.25))}
                >
                  <Icon name="plus" />
                </MapIconButton>
                <MapIconButton
                  aria-label="返回焦点"
                  appearance="ghost"
                  disabled={!focalId}
                  onClick={() => {
                    if (focalId) {
                      if (focalView.current)
                        setExpanded(new Set(focalView.current.expanded));
                      setScope(focalId);
                      setCameraRevision((v) => v + 1);
                    }
                  }}
                >
                  <Icon name="target" />
                </MapIconButton>
                <MapIconButton
                  aria-label="适应当前层"
                  appearance="ghost"
                  onClick={() => setCameraRevision((v) => v + 1)}
                >
                  <Icon name="square" />
                </MapIconButton>
                <MapIconButton
                  aria-label="全图概览"
                  appearance="ghost"
                  onClick={() => setZoom(null)}
                >
                  <Icon name="chart-dots" />
                </MapIconButton>
              </div>
              <div>
                <MapIconButton
                  aria-label="折叠全部"
                  appearance="ghost"
                  onClick={() => {
                    setExpanded(new Set());
                    setZoom(null);
                  }}
                >
                  <Icon name="layout-sidebar-left-collapse" />
                </MapIconButton>
                <MapIconButton
                  aria-label="展开全部"
                  appearance="ghost"
                  onClick={() => {
                    setExpanded(
                      new Set(
                        currentIR.nodes
                          .filter((n) => n.kind === "group")
                          .map((n) => n.id),
                      ),
                    );
                    setZoom(null);
                  }}
                >
                  <Icon name="layout-sidebar-left-expand" />
                </MapIconButton>
                <SelectField
                  menuPlacement="top"
                  label="路径视角"
                  hideLabel
                  value={pathMode}
                  options={[
                    { value: "expected", label: "预期路径" },
                    { value: "all", label: "全部路径" },
                  ]}
                  onChange={(e) =>
                    setPathMode(e.target.value as "expected" | "all")
                  }
                />
                <SelectField
                  menuPlacement="top"
                  label="布局方向"
                  hideLabel
                  value={direction}
                  options={[
                    { value: "RIGHT", label: "横向" },
                    { value: "DOWN", label: "纵向" },
                  ]}
                  onChange={(e) => {
                    setDirection(e.target.value as "RIGHT" | "DOWN");
                    setZoom(null);
                  }}
                />
              </div>
            </div>
            <div className="map-toolbar">
              <div>
                <Chip>{readonly ? "已发布演示版本 v1" : "草稿"}</Chip>
              </div>
              <div>
                <Button
                  appearance="ghost"
                  onClick={() => setPanel(panel === "issues" ? null : "issues")}
                >
                  <Icon
                    name={issues.length ? "exclamation-circle" : "circle-check"}
                  />
                  {issues.length ? issues.length + " 项待检查" : "检查"}
                </Button>
                {readonly ? (
                  <Button appearance="ghost" onClick={() => setReadonly(false)}>
                    返回草稿
                  </Button>
                ) : (
                  <>
                    <MapIconButton
                      aria-label="保存草稿"
                      appearance="ghost"
                      disabled={!!candidate}
                      onClick={() => {
                        try {
                          localStorage.setItem(
                            "crystra-map-draft",
                            JSON.stringify(ir),
                          );
                          setSaved(true);
                        } catch {
                          setError("本地保存失败，请导出草稿。");
                        }
                      }}
                    >
                      <Icon name="check" />
                    </MapIconButton>
                    <Button
                      disabled={!!candidate || busy || !!error}
                      onClick={() => publish.current?.showModal()}
                    >
                      发布版本
                    </Button>
                  </>
                )}
                <MapIconButton
                  appearance="ghost"
                  aria-label="打开设计验证台"
                  onClick={() => {
                    setJson(JSON.stringify(ir, null, 2));
                    setInputErrors([]);
                    lab.current?.showModal();
                  }}
                >
                  <Icon name="help" />
                </MapIconButton>
              </div>
            </div>
          </div>,
          headerHost,
        )}
      {mode === "crystallization" && <WorkflowCrystallization quote={quote} />}
      <div className="map-viewbar">
        <div>
          <MapIconButton
            appearance="ghost"
            aria-label={outlineOpen ? "隐藏活动大纲" : "显示活动大纲"}
            aria-expanded={outlineOpen}
            onClick={() => setOutlineOpen((v) => !v)}
          >
            <Icon
              name={
                outlineOpen
                  ? "layout-sidebar-left-collapse"
                  : "layout-sidebar-left-expand"
              }
            />
          </MapIconButton>
          <Button appearance="ghost" disabled={!scope} onClick={leaveScope}>
            返回上层
          </Button>
          <Button
            appearance="ghost"
            onClick={() => {
              setFocus(false);
              setSelected(null);
              setPanel(null);
              setZoom(null);
            }}
          >
            整个工作流
          </Button>
          {breadcrumbNode && (
            <>
              <Icon
                name="chevron-down"
                style={{ transform: "rotate(-90deg)" }}
              />
              {[
                ...mapAncestors(currentIR, breadcrumbNode.id),
                breadcrumbNode.id,
              ].map((id) => (
                <Button
                  key={id}
                  appearance="ghost"
                  onClick={() => {
                    setScope(id);
                    setCameraRevision((v) => v + 1);
                  }}
                >
                  {byId.get(id)!.title}
                </Button>
              ))}
            </>
          )}
        </div>
        <div className="map-search">
          <SearchField
            label="查找活动、材料或资源"
            hideLabel
            leading={<Icon name="search" />}
            placeholder="查找活动、材料或资源"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {query && (
          <div className="map-search-results">
            {currentIR.nodes
              .filter((n) =>
                [
                  n.title,
                  n.description,
                  ...(n.inputs || []),
                  ...(n.outputs || []),
                  ...(n.resources || []),
                ]
                  .join(" ")
                  .includes(query),
              )
              .map((n) => (
                <Button
                  key={n.id}
                  appearance="ghost"
                  onClick={() => locate(n.id)}
                >
                  {n.title}
                  <Typography variant="meta" tone="muted">
                    {mapAncestors(currentIR, n.id)
                      .map((id) => byId.get(id)!.title)
                      .join(" / ") || "顶层"}
                  </Typography>
                </Button>
              ))}
            {!currentIR.nodes.some((n) =>
              [
                n.title,
                n.description,
                ...(n.inputs || []),
                ...(n.outputs || []),
                ...(n.resources || []),
              ]
                .join(" ")
                .includes(query),
            ) && (
              <Typography variant="description">没有找到匹配活动</Typography>
            )}
          </div>
        )}
      </div>
      {mode === "crystallization" && (
        <div className="map-evidence-hint">
          <Typography variant="meta" tone="muted">
            选择活动，围绕材料、资源和重复工作继续研究；尚未绑定执行证据。
          </Typography>
        </div>
      )}
      {candidate && (
        <div className="map-candidate">
          <Typography variant="description">
            候选变化 · 图中突出显示修改的活动
          </Typography>
          <Button appearance="ghost" onClick={() => setCandidate(null)}>
            放弃候选
          </Button>
        </div>
      )}
      <div className="map-stage">
        <div
          className="map-outline-rail"
          data-open={outlineOpen}
          inert={!outlineOpen}
        >
          <div>
            <WorkflowMapOutline
              ir={currentIR}
              selected={selected || scope}
              onLocate={(id) => {
                locate(id);
                if (byId.get(id)?.kind === "group")
                  setExpanded((prev) => new Set([...prev, id]));
              }}
            />
          </div>
        </div>
        <div className="map-canvas-area">
          <div
            className="map-viewport"
            ref={viewport}
            aria-label="活动图画布"
            aria-busy={busy}
            data-camera-moving={moving}
          >
            {layout && (
              <svg
                width="100%"
                height="100%"
                role="group"
                aria-label="工作流活动图"
              >
                <defs>
                  <marker
                    id="map-arrow"
                    markerUnits="userSpaceOnUse"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="4"
                    orient="auto"
                    viewBox="0 0 8 8"
                  >
                    <path d="M0 0L8 4L0 8Z" fill="context-stroke" />
                  </marker>
                </defs>
                <g
                  className="map-camera"
                  data-camera-scope={scope || "$root"}
                  style={{
                    transform: `translate(${camera.x}px, ${camera.y}px) scale(${scale})`,
                  }}
                >
                  {layout.nodes
                    .filter((n) => n.expanded)
                    .map((n) => (
                      <g
                        key={n.id}
                        className="map-group"
                        data-out-of-scope={!inScope(n.id)}
                        opacity={nodeOpacity(n.id)}
                      >
                        <rect
                          x={n.x}
                          y={n.y}
                          width={n.width}
                          height={n.height}
                          rx="14"
                        />
                        <text
                          x={n.x + 18}
                          y={n.y + 30}
                          onClick={() => selectNode(n.id)}
                        >
                          {byId.get(n.id)?.title}
                        </text>
                        <g
                          role="button"
                          tabIndex={0}
                          aria-label={"收起 " + byId.get(n.id)?.title}
                          onClick={() => toggle(n.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggle(n.id);
                            }
                          }}
                          className="map-disclosure"
                        >
                          <rect
                            x={n.x + n.width - 38}
                            y={n.y + 10}
                            width="28"
                            height="28"
                            rx="6"
                          />
                          <path
                            d={`M${n.x + n.width - 30} ${n.y + 26}l6 -6l6 6`}
                          />
                        </g>
                      </g>
                    ))}
                  {layout.edges.map((e) => {
                    const semantic = projected.edges.find((x) => x.id === e.id);
                    return (
                      <g
                        key={e.segmentKey || e.id}
                        className={
                          "map-edge " +
                          (semantic?.kind === "material" ? "material" : "")
                        }
                        data-out-of-scope={
                          e.segmentKey
                            ? !!(
                                isolate &&
                                scope &&
                                (!e.scope || !inScope(e.scope))
                              )
                            : !!semantic &&
                              (!inScope(semantic.from) || !inScope(semantic.to))
                        }
                        data-intent={semantic?.intent || "unclassified"}
                        data-upstream={focus && related.has(e.id)}
                        data-selected={selected === e.id}
                        opacity={edgeOpacity(e.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={
                          "关系：" +
                          (semantic?.label ||
                            byId.get(semantic?.originalFrom || "")?.title +
                              " → " +
                              byId.get(semantic?.originalTo || "")?.title)
                        }
                        onClick={() => {
                          setSelected(e.id);
                          setFocus(true);
                          setPanel("detail");
                        }}
                        onKeyDown={(event) => keyboard(event, e.id)}
                      >
                        <path
                          d={e.path}
                          markerEnd={
                            e.arrow === false ? undefined : "url(#map-arrow)"
                          }
                        />
                        <path className="map-edge-hit" d={e.path} />
                        {e.label && (
                          <g>
                            <rect
                              x={e.label.x - 4}
                              y={e.label.y - 2}
                              width={e.label.width + 8}
                              height={e.label.height + 4}
                              rx="4"
                            />
                            <text x={e.label.x + 4} y={e.label.y + 17}>
                              {e.label.text.split("\n").map((line, i) => (
                                <tspan
                                  key={i}
                                  x={e.label!.x + 4}
                                  dy={i ? 20 : 0}
                                >
                                  {line}
                                </tspan>
                              ))}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                  {(layout.boundaries || [])
                    .filter((b) => !isolate || !scope || inScope(b.group))
                    .map((b) => (
                      <g
                        key={b.id}
                        className="map-boundary"
                        style={{
                          color: `var(--workflow-flow-${currentIR.edges.find((e) => e.id === b.edgeId)?.intent || "unclassified"})`,
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={
                          (b.direction === "in" ? "输入来自 " : "输出前往 ") +
                          byId.get(b.external)?.title
                        }
                        onClick={() => {
                          setSelected(b.edgeId);
                          setPanel("detail");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setSelected(b.edgeId);
                            setPanel("detail");
                          }
                        }}
                      >
                        <circle cx={b.x} cy={b.y} r="5" fill="currentColor" />
                        <title>
                          {byId.get(b.external)?.title} ·{" "}
                          {byId.get(b.target)?.title}
                        </title>
                        {scope === b.group && (
                          <text
                            x={
                              b.x +
                              (b.side === "WEST"
                                ? -12
                                : b.side === "EAST"
                                  ? 12
                                  : 0)
                            }
                            y={
                              b.y +
                              (b.side === "NORTH"
                                ? -14
                                : b.side === "SOUTH"
                                  ? 24
                                  : 5)
                            }
                            textAnchor={
                              b.side === "WEST"
                                ? "end"
                                : b.side === "EAST"
                                  ? "start"
                                  : "middle"
                            }
                            fill="currentColor"
                            fontSize="14"
                          >
                            {b.direction === "in" ? "来自 " : "前往 "}
                            {byId.get(b.external)?.title}
                          </text>
                        )}
                      </g>
                    ))}
                  {layout.nodes
                    .filter((n) => !n.expanded)
                    .map((n) => {
                      const semantic = byId.get(n.id);
                      if (!semantic) return null;
                      const changed =
                        candidate &&
                        JSON.stringify(ir.nodes.find((x) => x.id === n.id)) !==
                          JSON.stringify(semantic);
                      return (
                        <g
                          key={n.id}
                          role="button"
                          tabIndex={0}
                          aria-label={semantic.title}
                          data-map-node={n.id}
                          data-out-of-scope={!inScope(n.id)}
                          data-outcome={
                            semantic.kind === "end"
                              ? semantic.outcome || "completed"
                              : undefined
                          }
                          className={"map-node kind-" + semantic.kind}
                          data-upstream={focus && related.has(n.id)}
                          data-selected={selected === n.id}
                          data-changed={!!changed}
                          opacity={nodeOpacity(n.id)}
                          onClick={() => selectNode(n.id)}
                          onDoubleClick={() =>
                            semantic.kind === "group" && toggle(n.id)
                          }
                          onKeyDown={(e) => keyboard(e, n.id)}
                        >
                          {semantic.kind === "decision" ? (
                            <path
                              className="map-node-shape"
                              d={`M${n.x + n.width / 2} ${n.y}L${n.x + n.width} ${n.y + n.height / 2}L${n.x + n.width / 2} ${n.y + n.height}L${n.x} ${n.y + n.height / 2}Z`}
                            />
                          ) : semantic.kind === "start" ||
                            semantic.kind === "end" ? (
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
                              rx={
                                semantic.kind === "fork" ||
                                semantic.kind === "join"
                                  ? 0
                                  : 12
                              }
                            />
                          )}
                          <text
                            className="map-node-title"
                            style={
                              n.caption
                                ? { fontSize: 17, fontWeight: 400 }
                                : undefined
                            }
                            x={
                              n.caption
                                ? n.caption.x + n.caption.width / 2
                                : n.x + n.width / 2
                            }
                            y={
                              n.caption
                                ? n.caption.y + n.caption.baseline
                                : ["start", "end", "fork", "join"].includes(
                                      semantic.kind,
                                    )
                                  ? n.y + n.height + 24
                                  : n.y + n.height / 2 + 4
                            }
                            textAnchor="middle"
                          >
                            {semantic.title}
                          </text>
                          {!["start", "end", "fork", "join"].includes(
                            semantic.kind,
                          ) && (
                            <text
                              className="map-node-meta"
                              x={n.x + n.width / 2}
                              y={n.y + 22}
                              textAnchor="middle"
                            >
                              {semantic.kind === "group"
                                ? `${projected.nodes.find((x) => x.id === n.id)?.hiddenCount} 个内部活动`
                                : semantic.kind === "join"
                                  ? semantic.join === "any"
                                    ? "任一完成后继续"
                                    : "全部完成后继续"
                                  : kindName[semantic.kind]}
                            </text>
                          )}

                          {nodeIssues(n.id).length > 0 && (
                            <circle
                              className="map-issue-dot"
                              cx={n.x + n.width - 9}
                              cy={n.y + 9}
                              r="6"
                            />
                          )}
                          {semantic.kind === "group" && (
                            <g
                              className="map-disclosure"
                              role="button"
                              tabIndex={0}
                              aria-label={"展开 " + semantic.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggle(n.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggle(n.id);
                                }
                              }}
                            >
                              <rect
                                x={n.x + n.width - 35}
                                y={n.y + n.height - 32}
                                width="26"
                                height="26"
                                rx="5"
                              />
                              <path
                                d={`M${n.x + n.width - 27} ${n.y + n.height - 23}l5 5l5 -5`}
                              />
                            </g>
                          )}
                        </g>
                      );
                    })}
                </g>
              </svg>
            )}
            {busy && <span className="map-layout-status">正在整理布局…</span>}
            {error && (
              <div className="map-layout-error" role="alert">
                {error}；请在验证台修正定义。
              </div>
            )}
          </div>
          {layout && (
            <WorkflowMapMinimap
              layout={layout}
              camera={camera}
              bounds={bounds}
              onMove={(next) => {
                setIsolate(false);
                move(next, false);
              }}
            />
          )}
        </div>
        {panel && (
          <aside
            className="map-inspector"
            aria-label={panel === "issues" ? "工作流检查" : "活动与关系详情"}
          >
            <div className="map-panel-head">
              <Typography variant="section-title">
                {panel === "issues"
                  ? "待检查问题"
                  : current?.title || "关系详情"}
              </Typography>
              <MapIconButton
                appearance="ghost"
                aria-label="关闭详情"
                onClick={() => setPanel(null)}
              >
                <Icon name="x" />
              </MapIconButton>
            </div>
            {panel === "issues" ? (
              <>
                <Typography variant="description" tone="secondary">
                  问题不阻止保存草稿，发布前需处理阻塞项。
                </Typography>
                {issues.length ? (
                  issues.map((i, index) => (
                    <Card key={index} heading={i.message}>
                      <Typography variant="meta" tone="muted">
                        {i.nodeId ? byId.get(i.nodeId)?.title : "整个工作流"}
                      </Typography>
                      {i.nodeId && (
                        <Button
                          appearance="ghost"
                          onClick={() => locate(i.nodeId!)}
                        >
                          定位活动
                        </Button>
                      )}
                      {i.edgeId && (
                        <Button
                          appearance="ghost"
                          onClick={() => {
                            const edge = currentIR.edges.find(
                              (e) => e.id === i.edgeId,
                            );
                            if (edge) {
                              locate(edge.from);
                              setSelected(edge.id);
                            }
                          }}
                        >
                          定位关系
                        </Button>
                      )}
                      <Button
                        appearance="ghost"
                        onClick={() => quote("请补充：" + i.message)}
                      >
                        引用到 Chat
                      </Button>
                    </Card>
                  ))
                ) : (
                  <Typography variant="description">
                    当前结构检查没有发现问题。完整的资源与执行准入检查仍需接入发布服务。
                  </Typography>
                )}
              </>
            ) : current ? (
              <>
                <Typography variant="meta" tone="muted">
                  {mapAncestors(currentIR, current.id)
                    .map((id) => byId.get(id)!.title)
                    .join(" / ") || "顶层活动"}
                </Typography>
                <Typography variant="description">
                  {current.description || "展开查看这段工作的内部结构。"}
                </Typography>
                {current.kind === "group" && (
                  <Button appearance="ghost" onClick={() => toggle(current.id)}>
                    {expanded.has(current.id) ? "收起内部活动" : "展开内部活动"}
                  </Button>
                )}
                <Button appearance="ghost" onClick={() => setFocus((v) => !v)}>
                  {focus ? "显示所有路径" : "突出上游路径"}
                </Button>
                {(["inputs", "outputs", "resources"] as const).map((key, i) => (
                  <section key={key}>
                    <Typography variant="label">
                      {["需要的材料", "形成的成果", "关联资源"][i]}
                    </Typography>
                    <Typography as="p" variant="description" tone="secondary">
                      {current[key]?.join("、") || "尚未补充"}
                    </Typography>
                  </section>
                ))}
                <Button
                  appearance="ghost"
                  onClick={() => quote("关于「" + current.title + "」：")}
                >
                  引用到 Chat
                </Button>
              </>
            ) : currentEdge ? (
              <>
                <Typography variant="description">
                  {byId.get(currentEdge.from)?.title} →{" "}
                  {byId.get(currentEdge.to)?.title}
                </Typography>
                <Typography variant="description" tone="secondary">
                  {currentEdge.label || "完成后继续"}
                </Typography>
                <Typography variant="description">
                  流程意图：
                  {currentEdge.intent
                    ? {
                        expected: "预期推进",
                        rework: "返工",
                        recovery: "恢复",
                        exit: "退出",
                      }[currentEdge.intent]
                    : "待确认"}
                </Typography>
                {currentEdge.trigger && (
                  <Typography variant="description" tone="secondary">
                    触发条件：{currentEdge.trigger}
                  </Typography>
                )}
                <Typography variant="meta" tone="muted">
                  这里显示实际端点；折叠不会改变关系。
                </Typography>
                <Button
                  appearance="ghost"
                  onClick={() => locate(currentEdge.from)}
                >
                  定位来源
                </Button>
                <Button
                  appearance="ghost"
                  onClick={() => locate(currentEdge.to)}
                >
                  定位去向
                </Button>
              </>
            ) : null}
          </aside>
        )}
      </div>
      <dialog ref={lab} className="map-dialog map-lab" aria-label="设计验证台">
        <div className="map-panel-head">
          <Typography variant="section-title">设计验证台</Typography>
          <MapIconButton
            appearance="ghost"
            aria-label="关闭验证台"
            onClick={() => lab.current?.close()}
          >
            <Icon name="x" />
          </MapIconButton>
        </div>
        <Typography variant="description" tone="secondary">
          {candidatePreview
            ? "当前优先候选：三套样本由同一布局链预生成。修改 JSON 后需重新生成候选数据；不复用旧坐标。"
            : "供本轮验证：同一引擎加载不同方案。Agent 只提供语义 JSON，不填写坐标；非法输入不会替换当前图。"}
        </Typography>
        <div className="map-example-buttons">
          {samples.map((sample, i) => (
            <Button
              key={sample.title}
              appearance="ghost"
              onClick={() => {
                load(structuredClone(sample));
                lab.current?.close();
                setMessages([
                  {
                    role: "assistant",
                    text:
                      "已载入「" +
                      sample.title +
                      "」。图形由同一引擎生成，可以展开、折叠、查找或聚焦。",
                  },
                ]);
              }}
            >
              {["开发流程", "系统设计", "科研管理"][i]}
            </Button>
          ))}
        </div>
        <label className="map-json-label">
          Agent 输出 JSONIR
          <textarea
            aria-label="Agent 输出 JSONIR"
            spellCheck={false}
            value={json}
            onChange={(e) => setJson(e.target.value)}
          />
        </label>
        {inputErrors.length > 0 && (
          <div className="map-input-errors" role="alert">
            {inputErrors.map((e, i) => (
              <p key={i}>
                {e.path}：{e.message}
              </p>
            ))}
          </div>
        )}
        <div className="map-dialog-actions">
          <Button
            appearance="ghost"
            onClick={() => {
              try {
                const raw = localStorage.getItem("crystra-map-draft");
                if (raw) setJson(raw);
                else setError("没有已保存的本地草稿。");
              } catch {
                setError("无法读取本地草稿。");
              }
            }}
          >
            读取保存的草稿
          </Button>
          <Button onClick={acceptInput}>校验并显示</Button>
        </div>
      </dialog>
      <dialog ref={publish} className="map-dialog" aria-label="发布检查">
        <div className="map-panel-head">
          <Typography variant="section-title">版本发布检查</Typography>
          <MapIconButton
            appearance="ghost"
            aria-label="关闭发布检查"
            onClick={() => publish.current?.close()}
          >
            <Icon name="x" />
          </MapIconButton>
        </div>
        <Typography variant="description">
          {issues.some((i) => i.severity === "blocking")
            ? "当前有阻塞问题，请先补齐。"
            : "本版结构检查通过。"}
        </Typography>
        <Typography variant="description" tone="secondary">
          这里只验证发布交互，不执行真实发布。生产版本还必须通过 Workflow owner
          的执行定义、资源与准入校验。
        </Typography>
        {issues.map((i, index) => (
          <Typography key={index} variant="description">
            {i.message}
          </Typography>
        ))}
        <Button
          disabled={
            issues.some((i) => i.severity === "blocking") || !!candidate
          }
          onClick={() => {
            const checked = parseWorkflowMap(ir);
            if (
              !checked.ok ||
              checked.issues.some((i) => i.severity === "blocking")
            )
              return;
            setSnapshot(structuredClone(ir));
            setReadonly(true);
            publish.current?.close();
          }}
        >
          创建只读演示版本
        </Button>
      </dialog>
    </div>
  );
}
