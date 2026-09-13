import { useLayoutEffect } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Card, Chip, IconButton, Typography } from "./design-system";
import { SearchField, SelectField } from "./state-components";
import { Icon } from "./icon";
import {
  initialStudioDraft,
  applyStudioChange,
  checkStudioDraft,
  publishStudioDraft,
  type StudioDraft,
  type StudioChange,
} from "../domain/studio-intent-draft";
import "../studio-intent-review.css";
const activities = [
  {
    id: "understand",
    name: "理解任务",
    copy: "澄清目标、约束与已有材料",
    input: "需求 · 系统设计",
    output: "确认的工作范围",
  },
  {
    id: "design",
    name: "设计方案",
    copy: "细化模块职责与测试目标",
    input: "工作范围 · 现有代码",
    output: "详细设计 · 测试目标",
  },
  {
    id: "build",
    name: "实现与验证",
    copy: "逐个完成可验证的实现单元",
    input: "详细设计 · 测试目标",
    output: "实现 · 测试结果",
  },
  {
    id: "accept",
    name: "整体验收",
    copy: "检查结果是否满足设计预期",
    input: "实现 · 测试结果",
    output: "验收结论",
  },
  {
    id: "deliver",
    name: "整理交付",
    copy: "汇总成果与验证材料",
    input: "验收结论",
    output: "交付材料",
  },
  {
    id: "red",
    name: "编写并校准测试",
    copy: "确认测试因预期原因失败",
    input: "单元设计 · 测试目标",
    output: "有效的失败测试",
  },
  {
    id: "green",
    name: "完成最小实现",
    copy: "修改实现，使测试通过",
    input: "失败测试 · 代码",
    output: "通过测试的实现",
  },
  {
    id: "refactor",
    name: "检查与重构",
    copy: "保持行为，改善实现结构",
    input: "实现 · 测试",
    output: "重构结果",
  },
  {
    id: "verify",
    name: "验证当前单元",
    copy: "检查单元目标与相关回归",
    input: "实现 · 回归结果",
    output: "单元验证结论",
  },
];
const labels: Record<StudioChange, string> = {
  "return-path": "补齐验收失败的返回路径",
  "test-skill": "为测试活动绑定测试编写资源",
};
type Message = {
  role: "user" | "assistant";
  text: string;
  change?: StudioChange;
};
export function StudioIntentReview({
  mode,
  onDesign,
  workflowName,
}: {
  mode: string;
  onDesign: () => void;
  workflowName: string;
}) {
  const [draft, setDraft] = useState<StudioDraft>(initialStudioDraft),
    [version, setVersion] = useState("draft");
  const [published, setPublished] = useState<
    { label: string; content: StudioDraft }[]
  >([{ label: "v1", content: { returnPath: true, testSkill: true } }]);
  const [level, setLevel] = useState("overview"),
    [selected, setSelected] = useState<string | null>(null),
    [panel, setPanel] = useState<"detail" | "issues" | "changes" | null>(null);
  const [search, setSearch] = useState(""),
    [proposal, setProposal] = useState<StudioChange | null>(null),
    [changes, setChanges] = useState<StudioChange[]>([]);
  const [feed, setFeed] = useState<HTMLElement | null>(null),
    [storageStatus, setStorageStatus] = useState("草稿已保存"),
    [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "user",
      text: "根据需求与系统设计，先设计方案，再用 TDD 完成实现，最后验收交付。",
    },
    {
      role: "assistant",
      text: "我先把它整理为五个阶段。选择活动可以查看材料和规则，也可以展开「实现与验证」。当前有两处待补充，草稿已经保留。",
    },
  ]);
  const [check, setCheck] = useState<ReturnType<
      typeof checkStudioDraft
    > | null>(null),
    [checking, setChecking] = useState(false),
    [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    help = useRef<HTMLDialogElement>(null),
    timer = useRef<number | undefined>(undefined);
  const analyzing = mode === "crystallization",
    readonly = version !== "draft";
  const content = readonly
    ? published.find((p) => p.label === version)!.content
    : draft;
  const issues = checkStudioDraft(content).issues;
  useEffect(() => {
    if (selected)
      document
        .querySelector('.intent-node[data-selected="true"]')
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selected, level, panel]);
  const current = activities.find((n) => n.id === selected);
  const shown = activities.filter((n) =>
    (level === "overview"
      ? ["understand", "design", "build", "accept", "deliver"]
      : ["red", "green", "refactor", "verify"]
    ).includes(n.id),
  );
  const location = (id: string) => {
    setLevel(
      ["red", "green", "refactor", "verify"].includes(id) ? "tdd" : "overview",
    );
    setSelected(id);
    setPanel("detail");
    setSearch("");
  };
  const quote = (text: string) => {
    const input = document.querySelector<HTMLTextAreaElement>(
      '[data-host-owned="dsh-input"] textarea',
    );
    if (input) {
      input.value = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    }
  };
  const suggest = (change: StudioChange) => {
    if (readonly) {
      setNotice("切回草稿后再继续调整。");
      return;
    }
    setProposal(change);
    location(change === "return-path" ? "accept" : "red");
    setPanel("changes");
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text:
          change === "return-path"
            ? "建议补上「验收未通过 → 实现与验证」。当前流程尚未改变，请先检查高亮的返回路径。"
            : "建议为「编写并校准测试」绑定「测试编写指南」。输入与输出保持不变。",
        change,
      },
    ]);
  };
  const sendRef = useRef<(text: string) => void>(() => {});
  useLayoutEffect(() => {
    sendRef.current = (text) => {
      setMessages((m) => [...m, { role: "user", text }]);
      if (/失败|返回|未通过/.test(text)) suggest("return-path");
      else if (/资源|skill|测试编写|绑定/.test(text)) suggest("test-skill");
      else
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: "这版是交互演示，暂未连接 Agent。可以使用下方示例，体验意图定位、候选差异和发布检查。",
          },
        ]);
    };
  });
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(
      '[data-section-id="conversation-feed"]',
    );
    if (el) {
      el.replaceChildren();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Clear host placeholder content before mounting the React chat portal into this external node.
      setFeed(el);
    }
    const input = document.querySelector<HTMLTextAreaElement>(
        '[data-host-owned="dsh-input"] textarea',
      ),
      send = document.querySelector('[data-section-id="composer-send"]');
    const submit = (e: Event) => {
      if (!input?.value.trim()) return;
      e.preventDefault();
      e.stopPropagation();
      const text = input.value.trim();
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
  }, [feed, messages]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(
        "crystra-studio-intent-demo:" + workflowName,
      );
      if (raw) {
        const value = JSON.parse(raw);
        if (
          typeof value.draft?.returnPath === "boolean" &&
          typeof value.draft?.testSkill === "boolean"
        )
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate this legacy demo from external localStorage when workflow identity changes.
          setDraft(value.draft);
        if (
          Array.isArray(value.published) &&
          value.published.every(
            (p: { label?: unknown; content?: StudioDraft }) =>
              typeof p.label === "string" &&
              typeof p.content?.returnPath === "boolean" &&
              typeof p.content?.testSkill === "boolean",
          )
        )
          setPublished(value.published);
      }
    } catch {
      setStorageStatus("本地保存不可用");
    }
    setReady(true);
  }, [workflowName]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        "crystra-studio-intent-demo:" + workflowName,
        JSON.stringify({ draft, published }),
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Report the result of the localStorage write, including quota/security failures.
      setStorageStatus("草稿已保存");
    } catch {
      setStorageStatus("本地保存不可用");
    }
  }, [draft, published, ready, workflowName]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const adopt = (change: StudioChange) => {
    if (readonly) return;
    setDraft((d) => applyStudioChange(d, change));
    setChanges((c) => (c.includes(change) ? c : [...c, change]));
    setProposal(null);
    setCheck(null);
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: "已采用：" + labels[change] + "。草稿已更新，尚未发布。",
      },
    ]);
  };
  const runCheck = () => {
    setChecking(true);
    setCheck(null);
    const snapshot = { ...draft };
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setCheck(checkStudioDraft(snapshot));
      setChecking(false);
    }, 500);
  };
  const openPublish = () => {
    dialog.current?.showModal();
    runCheck();
  };
  const checkCurrent = check?.identity === JSON.stringify(draft);
  const publish = () => {
    if (!check) return;
    try {
      const next = publishStudioDraft(draft, check),
        label = "v" + (published.length + 1);
      setPublished((p) => [...p, { label, content: next.content }]);
      setVersion(label);
      setNotice(label + " 已在本地演示中发布");
      dialog.current?.close();
    } catch {
      setNotice("草稿有变化，请重新检查。");
    }
  };
  return (
    <div
      className="intent-studio"
      data-ui-owner="components"
      data-section-id="studio-intent-workbench"
    >
      {feed &&
        createPortal(
          <div className="intent-chat" data-ui-owner="components">
            <div className="intent-chat-label">
              <Typography variant="meta" tone="muted">
                设计对话
              </Typography>
              <Chip>交互演示</Chip>
            </div>
            {messages.map((m, i) => (
              <article key={i} className={"intent-message " + m.role}>
                <Typography as="p" variant="description">
                  {m.text}
                </Typography>
                {m.change && (
                  <div className="intent-chat-actions">
                    <Button
                      appearance="ghost"
                      size="compact"
                      disabled={
                        readonly ||
                        draft[
                          m.change === "return-path"
                            ? "returnPath"
                            : "testSkill"
                        ]
                      }
                      onClick={() => adopt(m.change!)}
                    >
                      {draft[
                        m.change === "return-path" ? "returnPath" : "testSkill"
                      ]
                        ? "已采用"
                        : "采用建议"}
                    </Button>
                    <Button
                      appearance="ghost"
                      size="compact"
                      onClick={() => {
                        setProposal(m.change!);
                        location(m.change === "return-path" ? "accept" : "red");
                        setPanel("changes");
                      }}
                    >
                      查看差异
                    </Button>
                  </div>
                )}
              </article>
            ))}
            <div className="intent-chat-examples">
              <Typography variant="meta" tone="muted">
                试着描述
              </Typography>
              <Button
                appearance="ghost"
                size="compact"
                onClick={() => quote("验收失败时，返回实现与验证。")}
              >
                验收失败后返回哪里？
              </Button>
              <Button
                appearance="ghost"
                size="compact"
                onClick={() => quote("为编写测试绑定测试编写指南。")}
              >
                补充测试活动的资源
              </Button>
            </div>
          </div>,
          feed,
        )}
      <div className="intent-toolbar">
        <div>
          <SelectField
            label="工作流版本"
            hideLabel
            value={version}
            onChange={(e) => {
              setVersion(e.target.value);
              setProposal(null);
              setCheck(null);
            }}
            options={[
              { value: "draft", label: "草稿" },
              ...published.map((p) => ({
                value: p.label,
                label: p.label + " · 已发布",
              })),
            ]}
          />
          <Typography variant="meta" tone="muted">
            {readonly ? "只读版本" : storageStatus}
          </Typography>
        </div>
        <div>
          {readonly ? (
            <Button appearance="ghost" onClick={() => setVersion("draft")}>
              继续编辑草稿
            </Button>
          ) : (
            <>
              <Button
                appearance="ghost"
                onClick={() => setPanel(panel === "changes" ? null : "changes")}
                startIcon={<Icon name="arrows-exchange" />}
              >
                变更{changes.length ? " " + changes.length : ""}
              </Button>
              <Button
                appearance="ghost"
                onClick={() => setPanel(panel === "issues" ? null : "issues")}
                startIcon={
                  <Icon
                    name={issues.length ? "exclamation-circle" : "circle-check"}
                  />
                }
              >
                {issues.length ? issues.length + " 处待补充" : "没有待补充问题"}
              </Button>
              <Button onClick={openPublish}>发布版本</Button>
            </>
          )}
          <IconButton
            appearance="ghost"
            aria-label="工作台设计帮助"
            onClick={() => help.current?.showModal()}
          >
            <Icon name="help" />
          </IconButton>
        </div>
      </div>
      <div className="intent-canvas-toolbar">
        <div className="intent-breadcrumb">
          <Button
            appearance="ghost"
            onClick={() => {
              setLevel("overview");
              setSelected(null);
            }}
          >
            流程概览
          </Button>
          {level === "tdd" && (
            <>
              <Icon
                name="chevron-down"
                style={{ transform: "rotate(-90deg)" }}
              />
              <Typography variant="label">实现与验证</Typography>
            </>
          )}
        </div>
        <div className="intent-search">
          <SearchField
            label="查找活动或资源"
            hideLabel
            placeholder="查找活动或资源"
            leading={<Icon name="search" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <div className="intent-search-results">
              {activities
                .filter((a) =>
                  (
                    a.name +
                    a.copy +
                    a.input +
                    (a.id === "red" ? "测试编写指南" : "")
                  ).includes(search),
                )
                .map((a) => (
                  <Button
                    key={a.id}
                    appearance="ghost"
                    onClick={() => location(a.id)}
                  >
                    {a.name}
                    <Typography variant="meta" tone="muted">
                      {["red", "green", "refactor", "verify"].includes(a.id)
                        ? "实现与验证"
                        : "流程概览"}
                    </Typography>
                  </Button>
                ))}
              {!activities.some((a) =>
                (
                  a.name +
                  a.copy +
                  a.input +
                  (a.id === "red" ? "测试编写指南" : "")
                ).includes(search),
              ) && (
                <Typography variant="description">没有找到相关活动</Typography>
              )}
            </div>
          )}
        </div>
      </div>
      {analyzing && (
        <div className="intent-analysis-strip">
          <Chip>演示执行样本 · 3 次</Chip>
          <Typography variant="description" tone="secondary">
            从重复工作中寻找可固化的部分
          </Typography>
          <Button appearance="ghost" onClick={() => location("red")}>
            查看候选 · 测试结果整理
          </Button>
        </div>
      )}
      <div className="intent-body">
        <div className="intent-graph" aria-label="工作流活动图">
          <svg
            viewBox="0 0 1240 620"
            role="group"
            aria-label={
              level === "overview" ? "流程概览活动图" : "实现与验证活动图"
            }
          >
            <defs>
              <marker
                id="intent-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            <circle cx="34" cy="280" r="6" className="intent-start" />
            <path
              className="intent-edge"
              d="M44 280H80"
              markerEnd="url(#intent-arrow)"
            />
            {shown.slice(0, -1).map((n, i) => (
              <path
                key={n.id}
                className="intent-edge"
                d={"M" + (260 + i * 230) + " 280H" + (310 + i * 230)}
                markerEnd="url(#intent-arrow)"
              />
            ))}
            {shown.map((n, i) => (
              <foreignObject
                key={n.id}
                x={80 + i * 230}
                y="224"
                width="180"
                height="142"
              >
                <div className="intent-node-wrap">
                  <button
                    className="wsr-card intent-node"
                    data-selected={selected === n.id}
                    data-changed={
                      (proposal === "return-path" && n.id === "accept") ||
                      (proposal === "test-skill" && n.id === "red")
                    }
                    onClick={() => {
                      setSelected(n.id);
                      setPanel("detail");
                    }}
                  >
                    <span className="intent-node-kicker">
                      {level === "overview"
                        ? "阶段 " + (i + 1)
                        : "活动 " + (i + 1)}
                    </span>
                    <Typography as="span" variant="item-title">
                      {n.name}
                    </Typography>
                    <Typography as="span" variant="meta" tone="muted">
                      {n.copy}
                    </Typography>
                    {issues.some(
                      (issue) =>
                        issue.node === n.id ||
                        (n.id === "build" && issue.node === "red"),
                    ) && <span className="intent-node-issue">● 待补充</span>}
                  </button>
                  {n.id === "build" && (
                    <IconButton
                      className="intent-expand"
                      appearance="ghost"
                      size="compact"
                      aria-label="展开实现与验证"
                      onClick={() => {
                        setLevel("tdd");
                        setSelected(null);
                        setPanel(null);
                      }}
                    >
                      <Icon
                        name="chevron-down"
                        style={{ transform: "rotate(-90deg)" }}
                      />
                    </IconButton>
                  )}
                </div>
              </foreignObject>
            ))}
            {level === "overview" &&
              (content.returnPath || proposal === "return-path") && (
                <g
                  className={
                    proposal === "return-path" && !content.returnPath
                      ? "intent-proposed"
                      : ""
                  }
                >
                  <path
                    className="intent-edge intent-return"
                    d="M860 366V446H630V370"
                    markerEnd="url(#intent-arrow)"
                  />
                  <text
                    x="745"
                    y="474"
                    textAnchor="middle"
                    className="intent-edge-label"
                  >
                    {proposal === "return-path" && !content.returnPath
                      ? "建议新增 · "
                      : ""}
                    验收未通过，返回实现与验证
                  </text>
                </g>
              )}
            {level === "tdd" && (
              <>
                <path
                  className="intent-edge intent-return"
                  d="M860 366V448H170V370"
                  markerEnd="url(#intent-arrow)"
                />
                <text
                  x="515"
                  y="477"
                  textAnchor="middle"
                  className="intent-edge-label"
                >
                  还有未满足的测试目标，继续下一轮
                </text>
              </>
            )}
            <path
              className="intent-edge"
              d={level === "overview" ? "M1180 280H1200" : "M950 280H985"}
              markerEnd="url(#intent-arrow)"
            />
            <circle
              cx={level === "overview" ? 1210 : 995}
              cy="280"
              r="8"
              fill="none"
              stroke="currentColor"
            />
            <circle
              cx={level === "overview" ? 1210 : 995}
              cy="280"
              r="4"
              className="intent-start"
            />
            <text x="80" y="120" className="intent-graph-caption">
              {level === "overview"
                ? "从目标到可交付成果"
                : "展开一段工作，检查其中的规则与材料"}
            </text>
          </svg>
          <div className="intent-graph-footer">
            <Typography variant="meta" tone="muted">
              {proposal
                ? "虚线表示候选变化，尚未采用"
                : "选择活动继续讨论 · 箭头表示工作如何推进"}
            </Typography>
            <Button
              appearance="ghost"
              size="compact"
              onClick={() => {
                setSelected(null);
                setPanel(null);
                setSearch("");
              }}
            >
              查看全图
            </Button>
          </div>
        </div>
        {panel && (
          <aside
            className="intent-panel"
            aria-label={
              panel === "issues"
                ? "待补充问题"
                : panel === "changes"
                  ? "变更详情"
                  : "活动详情"
            }
          >
            <div className="intent-panel-heading">
              <Typography variant="section-title">
                {panel === "issues"
                  ? "待补充"
                  : panel === "changes"
                    ? "本次变更"
                    : current?.name || "活动详情"}
              </Typography>
              <IconButton
                appearance="ghost"
                aria-label="关闭侧面板"
                onClick={() => setPanel(null)}
              >
                <Icon name="x" />
              </IconButton>
            </div>
            {panel === "issues" ? (
              <>
                <Typography variant="description" tone="secondary">
                  这些问题不影响保存草稿，发布前需要补齐。
                </Typography>
                {issues.map((issue) => (
                  <Card key={issue.id} heading={issue.title}>
                    <Typography variant="description" tone="secondary">
                      {issue.detail}
                    </Typography>
                    <div className="intent-panel-actions">
                      <Button
                        appearance="ghost"
                        onClick={() => location(issue.node)}
                      >
                        定位活动
                      </Button>
                      <Button
                        appearance="ghost"
                        onClick={() =>
                          quote(
                            issue.id === "return-path"
                              ? "验收失败时，返回实现与验证。"
                              : "为编写测试绑定测试编写指南。",
                          )
                        }
                      >
                        在 Chat 中补充
                      </Button>
                    </div>
                  </Card>
                ))}
                {!issues.length && (
                  <Typography variant="description">
                    没有待补充问题。发布时仍会检查当前完整草稿。
                  </Typography>
                )}
              </>
            ) : panel === "changes" ? (
              <>
                {proposal ? (
                  <Card heading={labels[proposal]}>
                    <Typography variant="description">
                      {proposal === "return-path"
                        ? "原来：验收未通过后没有后续安排。建议：返回「实现与验证」。"
                        : "原来：测试资源未确定。建议：绑定「测试编写指南」。"}
                    </Typography>
                    <Typography variant="meta" tone="muted">
                      候选建议 · 在 Chat 中采用后才更新草稿
                    </Typography>
                    <Button
                      appearance="ghost"
                      onClick={() => {
                        setProposal(null);
                      }}
                    >
                      收起候选
                    </Button>
                  </Card>
                ) : (
                  <Typography variant="description" tone="secondary">
                    {changes.length
                      ? "以下修改已进入草稿，尚未发布。"
                      : "还没有本次采用的修改。"}
                  </Typography>
                )}
                {changes.map((c) => (
                  <div className="intent-change" key={c}>
                    <Icon name="circle-check" />
                    <Typography variant="description">{labels[c]}</Typography>
                  </div>
                ))}
              </>
            ) : (
              current && (
                <>
                  <Typography variant="description" tone="secondary">
                    {current.copy}
                  </Typography>
                  <Typography variant="label">需要什么</Typography>
                  <Typography variant="description">{current.input}</Typography>
                  <Typography variant="label">得到什么</Typography>
                  <Typography variant="description">
                    {current.output}
                  </Typography>
                  <Typography variant="label">工作规则</Typography>
                  <Typography variant="description">
                    {current.id === "green"
                      ? "只修改实现，不修改测试；发现测试问题时先澄清。"
                      : current.id === "accept"
                        ? "根据设计目标和验证材料确认结果。"
                        : current.id === "red"
                          ? "测试必须因预期行为未满足而失败。"
                          : "完成当前成果后，再推进后续工作。"}
                  </Typography>
                  <Typography variant="label">关联资源</Typography>
                  <Chip>
                    {current.id === "red"
                      ? content.testSkill
                        ? "测试编写指南"
                        : "测试资源待确定"
                      : current.id === "design"
                        ? "详细设计模板"
                        : "随工作配置"}
                  </Chip>
                  {analyzing && current.id === "red" && (
                    <Card heading="可研究：测试结果整理">
                      <Typography variant="description">
                        三个演示样本都包含相同的报告字段整理。可研究用 script
                        提取字段，将失败原因判断保留给 Agent。
                      </Typography>
                      <Button
                        appearance="ghost"
                        onClick={() => {
                          quote(
                            "请研究把测试报告字段整理结晶为 script，保留失败原因判断。",
                          );
                          onDesign();
                        }}
                      >
                        带回流程设计讨论
                      </Button>
                    </Card>
                  )}
                  {current.id === "build" && (
                    <Button
                      appearance="ghost"
                      onClick={() => {
                        setLevel("tdd");
                        setPanel(null);
                      }}
                    >
                      展开内部活动
                    </Button>
                  )}
                  <Button
                    appearance="ghost"
                    onClick={() => quote("关于「" + current.name + "」：")}
                  >
                    引用到 Chat
                  </Button>
                </>
              )
            )}
          </aside>
        )}
      </div>
      <span className="intent-notice" role="status">
        {notice}
      </span>
      <dialog
        ref={dialog}
        className="intent-dialog"
        aria-label="发布工作流版本"
      >
        <div className="intent-panel-heading">
          <Typography variant="section-title">发布新版本</Typography>
          <IconButton
            appearance="ghost"
            aria-label="关闭发布检查"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="x" />
          </IconButton>
        </div>
        <Typography variant="description" tone="secondary">
          发布前检查当前草稿。已发布版本不会被覆盖。
        </Typography>
        <div className="intent-release-result" aria-live="polite">
          {checking ? (
            "正在检查流程、材料与资源…"
          ) : !checkCurrent ? (
            "草稿已有变化，需要重新检查。"
          ) : check?.issues.length ? (
            <>
              <Typography variant="item-title">
                还有 {check.issues.length} 处问题，暂不能发布
              </Typography>
              {check.issues.map((issue) => (
                <Button
                  key={issue.id}
                  appearance="ghost"
                  onClick={() => {
                    dialog.current?.close();
                    location(issue.node);
                    setPanel("issues");
                  }}
                >
                  {issue.title}
                  <Icon
                    name="chevron-down"
                    style={{ transform: "rotate(-90deg)" }}
                  />
                </Button>
              ))}
            </>
          ) : (
            <>
              <Icon name="circle-check" />
              <Typography variant="item-title">当前草稿通过演示检查</Typography>
              <Typography variant="description">
                将创建独立版本 v{published.length + 1}。
              </Typography>
            </>
          )}
        </div>
        <div className="intent-dialog-actions">
          <Button appearance="ghost" onClick={() => dialog.current?.close()}>
            继续设计
          </Button>
          <Button appearance="ghost" disabled={checking} onClick={runCheck}>
            重新检查
          </Button>
          <Button
            disabled={checking || !checkCurrent || !!check?.issues.length}
            onClick={publish}
          >
            确认发布
          </Button>
        </div>
        <Typography variant="meta" tone="muted">
          本地交互演示，不发布到实际环境。
        </Typography>
      </dialog>
      <dialog ref={help} className="intent-dialog" aria-label="工作台设计帮助">
        <div className="intent-panel-heading">
          <Typography variant="section-title">从对话形成工作流</Typography>
          <IconButton
            appearance="ghost"
            aria-label="关闭工作台帮助"
            onClick={() => help.current?.close()}
          >
            <Icon name="x" />
          </IconButton>
        </div>
        <Typography variant="description">
          选择活动，在 Chat
          中描述意图；检查候选变化，采用后更新草稿。展开阶段查看内部流程，搜索可直接定位深层活动。缺口不阻止保存，发布新版本时才强制检查。
        </Typography>
        <Typography variant="description" tone="secondary">
          本地样本支持「验收失败时返回实现」和「绑定测试编写资源」两段演示对话。保存与版本仅保存在当前浏览器；正式执行校验、Agent
          和发布服务尚未连接。
        </Typography>
      </dialog>
    </div>
  );
}
