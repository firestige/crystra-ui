import { useLayoutEffect } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Chip,
  IconButton,
  TextInput,
  Typography,
} from "./design-system";
import { SearchField, SelectField } from "./state-components";
import { Icon, type IconName } from "./icon";
import { WidgetTooltip } from "./widget-tooltip";
import type { WorkflowMapIR } from "../domain/workflow-map-ir";
import "../workflow-resource-config.css";
type ResourceKind = "role" | "skill" | "script" | "template";
type Resource = {
  id: string;
  name: string;
  version: string;
  description: string;
  kind: ResourceKind;
};
type TemplateUse = { id: string; use: string };
type Profile = {
  instructions?: string;
  contents?: Record<string, string>;
  origin?: string;
  id: string;
  name: string;
  description: string;
  mode: "agent" | "script";
  primary: string;
  skills: string[];
  templates: TemplateUse[];
  parameters: string;
  refs: string[];
};
const catalog: Resource[] = [
  {
    id: "architect@2",
    name: "系统架构师",
    version: "2.0.0",
    description: "明确架构边界，权衡约束与质量目标。",
    kind: "role",
  },
  {
    id: "developer@3",
    name: "软件工程师",
    version: "3.1.0",
    description: "实现设计目标，验证行为与代码质量。",
    kind: "role",
  },
  {
    id: "reviewer@1",
    name: "质量审查员",
    version: "1.2.0",
    description: "独立检查实现与设计约定的一致性。",
    kind: "role",
  },
  {
    id: "design@2",
    name: "架构设计",
    version: "2.3.0",
    description: "从场景与约束形成架构方案。",
    kind: "skill",
  },
  {
    id: "tradeoffs@1",
    name: "方案权衡",
    version: "1.0.0",
    description: "比较候选方案，记录选择理由。",
    kind: "skill",
  },
  {
    id: "tdd@3",
    name: "测试驱动开发",
    version: "3.0.0",
    description: "围绕行为目标执行红绿重构循环。",
    kind: "skill",
  },
  {
    id: "review@1",
    name: "代码审查",
    version: "1.4.0",
    description: "检查正确性、边界条件与可维护性。",
    kind: "skill",
  },
  {
    id: "progress@1",
    name: "项目进展计算",
    version: "1.1.0",
    description: "汇总项目记录，计算进展与关键动作覆盖。",
    kind: "script",
  },
  {
    id: "report@2",
    name: "验证报告整理",
    version: "2.0.0",
    description: "读取验证结果，生成结构化报告。",
    kind: "script",
  },
  {
    id: "spec@2",
    name: "系统设计文档",
    version: "2.1.0",
    description: "架构视图、关键决策与非功能性目标。",
    kind: "template",
  },
  {
    id: "inputs@1",
    name: "需求与约束清单",
    version: "1.0.0",
    description: "组织输入材料与待确认的设计约束。",
    kind: "template",
  },
  {
    id: "result@1",
    name: "验证结果",
    version: "1.2.0",
    description: "记录验证项、结果与证据引用。",
    kind: "template",
  },
];
const initial: Profile[] = [
  {
    id: "architecture",
    name: "架构设计",
    origin: "初次引导",
    instructions: "先核对需求与约束，再比较方案。形成详细设计及相应测试目标。",
    description: "根据需求与系统约束形成详细设计及测试目标。",
    mode: "agent",
    primary: "architect@2",
    skills: ["design@2", "tradeoffs@1"],
    templates: [
      { id: "inputs@1", use: "input" },
      { id: "spec@2", use: "output" },
    ],
    parameters: "",
    refs: ["read", "design"],
  },
  {
    id: "implementation",
    name: "单元实现",
    origin: "初次引导",
    instructions: "围绕当前测试目标实现最小变更，保留验证证据。",
    description: "根据测试目标完成最小实现与重构。",
    mode: "agent",
    primary: "developer@3",
    skills: ["tdd@3"],
    templates: [{ id: "result@1", use: "output" }],
    parameters: "",
    refs: ["green"],
  },
  {
    id: "review",
    name: "独立复核",
    origin: "对话调整",
    instructions: "独立检查实现与设计约定的一致性，给出问题及证据。",
    description: "检查实现是否符合设计约定。",
    mode: "agent",
    primary: "reviewer@1",
    skills: ["review@1"],
    templates: [{ id: "result@1", use: "output" }],
    parameters: "",
    refs: [],
  },
  {
    id: "report",
    name: "验证报告整理",
    origin: "结晶分析",
    instructions: "整理验证结果，保留证据引用，不推断未执行的测试结果。",
    description: "把验证结果整理为固定结构的报告。",
    mode: "script",
    primary: "report@2",
    skills: [],
    templates: [{ id: "result@1", use: "output" }],
    parameters: '{"includeEvidence": true}',
    refs: [],
  },
];
const resourceContents: Record<string, string> = {
  "spec@2":
    "# 系统设计文档\n\n## 目标与约束\n## 架构视图\n## 关键决策与取舍\n## 非功能性目标\n## 验证计划",
  "inputs@1":
    "# 需求与约束清单\n\n- 目标与使用场景\n- 已确认约束\n- 待澄清问题\n- 输入材料与来源",
  "result@1":
    "# 验证结果\n\n- 验证目标\n- 实际结果\n- 证据引用\n- 未通过项与原因",
  "report@2":
    "# 验证报告整理\n\n输入：结构化验证记录。\n处理：按验证项汇总结果，保留原始证据引用。\n产出：验证结果报告。\n边界：不执行测试，不把缺失记录推断为通过。",
  "progress@1":
    "# 项目进展计算\n\n输入：项目记录与关键动作清单。\n处理：按已确认口径汇总进展与覆盖率。\n产出：进展汇总。\n边界：缺失数据单列，不填补推测值。",
};
const typeLabels = {
  role: "角色",
  skill: "技能",
  script: "脚本",
  template: "模板",
};
function Action({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <WidgetTooltip text={label} focusable={!!disabled}>
      <IconButton
        appearance="ghost"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
      >
        <Icon name={icon} />
      </IconButton>
    </WidgetTooltip>
  );
}
export function WorkflowResourceConfig({
  workflow,
  onLocate,
}: {
  workflow: WorkflowMapIR | null;
  onLocate: (id: string) => void;
}) {
  const [profiles, setProfiles] = useState<Profile[]>(() =>
    initial.map((p) => ({
      ...p,
      refs: workflow?.title === "Implementation" ? p.refs : [],
    })),
  );
  const [selected, setSelected] = useState("architecture"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [notice, setNotice] = useState(""),
    [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState<Profile>(() => ({
    ...initial[0],
    refs: workflow?.title === "Implementation" ? initial[0].refs : [],
  }));
  const [pickerKind, setPickerKind] = useState<ResourceKind>("role"),
    [pickerQuery, setPickerQuery] = useState("");
  const [dialogMode, setDialogMode] = useState<
      "new" | "copy" | "delete" | "switch" | "leave" | "help"
    >("new"),
    [newName, setNewName] = useState(""),
    [newMode, setNewMode] = useState<"agent" | "script">("agent"),
    [nextId, setNextId] = useState("");
  const picker = useRef<HTMLDialogElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const contentDialog = useRef<HTMLDialogElement>(null);
  const [authoringOpen, setAuthoringOpen] = useState(false);
  const incoming = useRef<(text: string) => void>(() => {});
  useEffect(() => {
    const receive = (event: Event) =>
      incoming.current(String((event as CustomEvent).detail.text));
    window.addEventListener("crystra-resource-message", receive);
    return () =>
      window.removeEventListener("crystra-resource-message", receive);
  }, []);
  const [chatMode, setChatMode] = useState<"new" | "update">("update"),
    [chatInput, setChatInput] = useState(""),
    [chatName, setChatName] = useState(""),
    [chatType, setChatType] = useState<"agent" | "script">("agent"),
    [chatTarget, setChatTarget] = useState<string | null>(null),
    [proposal, setProposal] = useState<{
      base: string;
      profile: Profile;
      request: string;
      changes: string[];
    } | null>(null),
    [chatError, setChatError] = useState("");
  const [contentId, setContentId] = useState(""),
    [contentText, setContentText] = useState("");
  const openChat = (mode: "new" | "update", target: string | null = null) => {
    if (mode === "new" && dirty) {
      setNotice("请先保存当前修改，再创建新的配置。");
      return;
    }
    setChatMode(mode);
    setChatTarget(target);
    setChatInput("");
    setChatName("");
    setChatType(draft.mode);
    setProposal(null);
    setChatError("");
    setAuthoringOpen(true);
    window.dispatchEvent(
      new CustomEvent("crystra-studio-chat-note", {
        detail: {
          text:
            mode === "new"
              ? "请在左侧描述新资源配置的工作要求；名称与执行方式可在右侧填写。"
              : "正在调整「" +
                draft.name +
                "」" +
                (target ? "的资源内容" : "") +
                "。请在左侧描述修改要求，右侧将展示演示候选。",
        },
      }),
    );
    document
      .querySelector<HTMLTextAreaElement>(
        '[data-host-owned="dsh-input"] textarea',
      )
      ?.focus();
  };
  const contentOf = (id: string) =>
    draft.contents?.[id] ||
    resourceContents[id] ||
    "# " +
      (catalog.find((r) => r.id === id)?.name || "资源") +
      "\n\n" +
      (catalog.find((r) => r.id === id)?.description || "");
  const viewContent = (id: string) => {
    setContentId(id);
    setContentText(contentOf(id));
    contentDialog.current?.showModal();
  };
  const propose = (text = chatInput) => {
    const request = text.trim();
    if (!request) return;
    const profile: Profile =
      chatMode === "new"
        ? {
            id: "profile-" + Date.now(),
            name: chatName.trim() || "新的执行配置",
            description: request,
            mode: chatType,
            primary: "",
            skills: [],
            templates: [],
            parameters: "",
            refs: [],
            instructions: request,
            origin: "对话创建",
          }
        : structuredClone(draft);
    if (chatMode === "update") {
      if (chatTarget) {
        profile.contents = {
          ...profile.contents,
          [chatTarget]:
            contentOf(chatTarget) + "\n\n## 本次调整要求\n" + request,
        };
      } else
        profile.instructions = (profile.instructions || "") + "\n" + request;
      profile.origin = "对话调整";
    }
    setProposal({
      base: JSON.stringify(draft),
      profile,
      request,
      changes:
        chatMode === "new"
          ? ["创建独立配置，尚未绑定活动", "记录工作要求，执行主体待选择"]
          : chatTarget
            ? ["为当前配置创建资源内容草稿", "保留原资源版本，其他配置不变"]
            : ["更新工作指令", "执行主体、能力及模板绑定保持不变"],
    });
  };
  const applyProposal = () => {
    if (!proposal) return;
    if (proposal.base !== JSON.stringify(draft)) {
      setChatError("配置已变化，请重新生成候选。");
      return;
    }
    if (chatMode === "new") {
      setProfiles((ps) => [...ps, proposal.profile]);
      setSelected(proposal.profile.id);
    }
    setDraft(structuredClone(proposal.profile));
    setDirty(true);
    setNotice("候选已应用到编辑草稿 · 尚未保存");
    setProposal(null);
    setAuthoringOpen(false);
    setChatMode("update");
    setChatTarget(null);
  };
  useLayoutEffect(() => {
    incoming.current = (text) => {
      setChatInput(text);
      setAuthoringOpen(true);
      setChatError("");
      propose(text);
    };
  });
  const resource = (id: string) => catalog.find((r) => r.id === id);
  const update = (patch: Partial<Profile>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
    setNotice("");
  };
  const select = (id: string) => {
    const p = profiles.find((p) => p.id === id);
    if (p) {
      setSelected(id);
      setDraft(structuredClone(p));
      setDirty(false);
      setNotice("");
    }
  };
  const requestSelect = (id: string) => {
    if (id === selected) return;
    if (dirty) {
      setNextId(id);
      setDialogMode("leave");
      dialog.current?.showModal();
    } else select(id);
  };
  const openDialog = (mode: typeof dialogMode) => {
    setDialogMode(mode);
    setNewName(mode === "copy" ? draft.name + " · 副本" : "");
    setNewMode(draft.mode);
    dialog.current?.showModal();
  };
  const choose = (kind: ResourceKind) => {
    setPickerKind(kind);
    setPickerQuery("");
    picker.current?.showModal();
  };
  const acceptResource = (r: Resource) => {
    if (r.kind === "role" || r.kind === "script") update({ primary: r.id });
    if (r.kind === "skill")
      update({ skills: [...new Set([...draft.skills, r.id])] });
    if (r.kind === "template")
      update({ templates: [...draft.templates, { id: r.id, use: "output" }] });
    picker.current?.close();
  };
  const save = () => {
    if (!draft.name.trim() || !draft.primary) {
      setNotice("请填写配置名称并选择执行主体。");
      return false;
    }
    if (draft.mode === "script" && draft.parameters.trim()) {
      try {
        JSON.parse(draft.parameters);
      } catch {
        setNotice("脚本参数需要是有效的 JSON。");
        return false;
      }
    }
    setProfiles((ps) =>
      ps.map((p) => (p.id === selected ? structuredClone(draft) : p)),
    );
    setDirty(false);
    setNotice(
      "草稿已更新" +
        (draft.refs.length
          ? " · 影响 " + draft.refs.length + " 个引用活动"
          : ""),
    );
    return true;
  };
  const addProfile = () => {
    const id = "profile-" + Date.now();
    const p: Profile =
      dialogMode === "copy"
        ? { ...structuredClone(draft), id, name: newName.trim(), refs: [] }
        : {
            id,
            name: newName.trim(),
            description: "",
            mode: newMode,
            primary: "",
            skills: [],
            templates: [],
            parameters: "",
            refs: [],
          };
    setProfiles((ps) => [...ps, p]);
    setSelected(id);
    setDraft(structuredClone(p));
    setDirty(dialogMode === "new");
    setNotice(dialogMode === "copy" ? "已创建独立副本 · 未绑定活动" : "");
    dialog.current?.close();
  };
  const remove = () => {
    const ps = profiles.filter((p) => p.id !== selected);
    setProfiles(ps);
    if (ps[0]) {
      setSelected(ps[0].id);
      setDraft(structuredClone(ps[0]));
    } else setSelected("");
    setDirty(false);
    dialog.current?.close();
    setNotice("配置已删除");
  };
  const visible = profiles.filter(
    (p) =>
      (filter === "all" || p.mode === filter) &&
      (p.name + p.description).toLowerCase().includes(query.toLowerCase()),
  );
  const refs = draft.refs
    .map((id) => workflow?.nodes.find((n) => n.id === id))
    .filter((n) => !!n);
  return (
    <section
      className="resource-config crystra-bi"
      data-crystra-theme="dark"
      data-ui-owner="components"
      data-section-id="workflow-resource-config"
    >
      <aside className="resource-list">
        <div className="resource-list-head">
          <Typography variant="section-title">
            执行配置 <span className="resource-count">{profiles.length}</span>
          </Typography>
          <div>
            <Action
              label="配置帮助"
              icon="help"
              onClick={() => openDialog("help")}
            />
            <Action
              label="通过对话创建配置"
              icon="command"
              onClick={() => openChat("new")}
            />
            <Action
              label="新建配置"
              icon="plus"
              onClick={() => openDialog("new")}
            />
          </div>
        </div>
        <SearchField
          label="搜索执行配置"
          hideLabel
          placeholder="搜索配置"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="resource-filter">
          <SelectField
            label="执行方式筛选"
            hideLabel
            value={filter}
            options={[
              { value: "all", label: "全部配置" },
              { value: "agent", label: "Agent 执行" },
              { value: "script", label: "Script 执行" },
            ]}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="resource-list-items">
          {visible.map((p) => (
            <div
              key={p.id}
              className="resource-list-item"
              data-selected={p.id === selected}
            >
              <button
                className="resource-select"
                aria-label={"选择配置 " + p.name}
                aria-current={p.id === selected ? "true" : undefined}
                onClick={() => requestSelect(p.id)}
              >
                <span className={"resource-type-icon " + p.mode}>
                  <Icon name={p.mode === "agent" ? "shield-lock" : "binary"} />
                </span>
                <span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.mode === "agent" ? "Agent" : "Script"}
                    <span>·</span>
                    {p.refs.length ? p.refs.length + " 个活动引用" : "未绑定"}
                  </small>
                </span>
                {p.id === selected && dirty && (
                  <span className="resource-dirty" aria-label="有未保存修改" />
                )}
              </button>
            </div>
          ))}
          {!visible.length && (
            <Typography variant="description" tone="muted">
              没有匹配的配置
            </Typography>
          )}
        </div>
        <div className="resource-list-foot">
          <Icon name="git-branch" />
          <Typography variant="meta" tone="muted">
            当前工作流 · 配置草稿
          </Typography>
        </div>
      </aside>
      <main className="resource-editor">
        {!selected ? (
          <div className="resource-empty">
            <Typography variant="section-title">还没有执行配置</Typography>
            <Button onClick={() => openDialog("new")}>新建配置</Button>
          </div>
        ) : (
          <>
            <header className="resource-editor-head">
              <div>
                <div className="resource-eyebrow">
                  执行配置 <span>/</span>{" "}
                  {draft.mode === "agent" ? "Agent" : "Script"}
                </div>
                <Typography as="h2" variant="page-title">
                  {draft.name || "未命名配置"}
                </Typography>
              </div>
              <div className="resource-editor-actions">
                <span className="resource-save-state" role="status">
                  {notice || (dirty ? "有未保存修改" : "已保存至本页草稿")}
                </span>
                <Button
                  appearance="ghost"
                  onClick={() => openChat("update")}
                  aria-label="通过对话调整配置"
                >
                  <Icon name="command" />
                  对话调整
                </Button>
                <Action
                  label="复制配置"
                  icon="copy"
                  onClick={() => openDialog("copy")}
                />
                <Action
                  label="删除当前配置"
                  icon="trash"
                  onClick={() => openDialog("delete")}
                />
                <Button onClick={save}>保存配置</Button>
              </div>
            </header>
            <div className="resource-editor-scroll">
              <div className="resource-edit-grid">
                <div className="resource-edit-main">
                  <section className="resource-basics">
                    <label>
                      <Typography variant="label">配置名称</Typography>
                      <TextInput
                        type="text"
                        aria-label="配置名称"
                        value={draft.name}
                        onChange={(e) => update({ name: e.target.value })}
                      />
                    </label>
                    <SelectField
                      label="执行方式"
                      value={draft.mode}
                      options={[
                        { value: "agent", label: "Agent 执行" },
                        { value: "script", label: "Script 执行" },
                      ]}
                      onChange={() => openDialog("switch")}
                    />
                    <label className="resource-description">
                      <Typography variant="label">用途</Typography>
                      <TextInput
                        type="text"
                        aria-label="配置用途"
                        placeholder="这份配置适合完成什么工作"
                        value={draft.description}
                        onChange={(e) =>
                          update({ description: e.target.value })
                        }
                      />
                    </label>
                  </section>
                  <Card
                    className="resource-card"
                    heading={
                      draft.mode === "agent" ? "职责与指令" : "确定性处理"
                    }
                    actions={
                      <Action
                        label="调整职责与处理要求"
                        icon="command"
                        onClick={() => openChat("update")}
                      />
                    }
                  >
                    <div className="resource-subject">
                      <span className={"resource-type-icon " + draft.mode}>
                        <Icon
                          name={
                            draft.mode === "agent" ? "shield-lock" : "binary"
                          }
                          size="content-marker"
                        />
                      </span>
                      <div>
                        <Typography variant="item-title">
                          {resource(draft.primary)?.name ||
                            "尚未选择" +
                              (draft.mode === "agent" ? "角色" : "脚本")}
                        </Typography>
                        <Typography
                          as="p"
                          variant="description"
                          tone="secondary"
                        >
                          {resource(draft.primary)?.description ||
                            "选择这项工作的执行主体。"}
                        </Typography>
                        {resource(draft.primary) && (
                          <span className="resource-version">
                            v{resource(draft.primary)!.version}
                          </span>
                        )}
                      </div>
                      <Button
                        appearance="ghost"
                        onClick={() =>
                          choose(draft.mode === "agent" ? "role" : "script")
                        }
                      >
                        {draft.primary
                          ? "更换"
                          : draft.mode === "agent"
                            ? "选择角色"
                            : "选择脚本"}
                      </Button>
                    </div>
                    <label className="resource-instruction-field">
                      <Typography variant="label">
                        {draft.mode === "agent" ? "工作指令" : "处理要求"}
                      </Typography>
                      <textarea
                        aria-label="工作指令"
                        value={draft.instructions || ""}
                        onChange={(e) =>
                          update({ instructions: e.target.value })
                        }
                        placeholder="描述工作要求、约束和完成标准"
                      />
                    </label>
                    {draft.primary && (
                      <Button
                        appearance="ghost"
                        onClick={() => viewContent(draft.primary)}
                      >
                        查看{draft.mode === "agent" ? "职责内容" : "程序说明"}
                      </Button>
                    )}
                  </Card>
                  {draft.mode === "agent" && (
                    <Card
                      className="resource-card"
                      heading="使用的能力"
                      actions={
                        <Action
                          label="添加技能"
                          icon="plus"
                          onClick={() => choose("skill")}
                        />
                      }
                    >
                      <div className="resource-rows">
                        {draft.skills.map((id) => (
                          <div className="resource-row" key={id}>
                            <Icon name="target" />
                            <div>
                              <button
                                className="resource-content-link"
                                aria-label={"查看资源 " + resource(id)?.name}
                                onClick={() => viewContent(id)}
                              >
                                {resource(id)?.name}
                              </button>
                              <p>{resource(id)?.description}</p>
                            </div>
                            <span className="resource-version">
                              v{resource(id)?.version}
                            </span>
                            <Action
                              label={"移除技能 " + resource(id)?.name}
                              icon="x"
                              onClick={() =>
                                update({
                                  skills: draft.skills.filter((x) => x !== id),
                                })
                              }
                            />
                          </div>
                        ))}
                        {!draft.skills.length && (
                          <Typography variant="description" tone="muted">
                            尚未添加技能
                          </Typography>
                        )}
                      </div>
                    </Card>
                  )}
                  <Card
                    className="resource-card"
                    heading="输入与产出"
                    actions={
                      <Action
                        label="添加模板"
                        icon="plus"
                        onClick={() => choose("template")}
                      />
                    }
                  >
                    <div className="resource-rows">
                      {draft.templates.map((t, i) => (
                        <div className="resource-row" key={t.id}>
                          <Icon name="file" />
                          <div>
                            <button
                              className="resource-content-link"
                              aria-label={"查看资源 " + resource(t.id)?.name}
                              onClick={() => viewContent(t.id)}
                            >
                              {resource(t.id)?.name}
                            </button>
                            <p>v{resource(t.id)?.version}</p>
                          </div>
                          <SelectField
                            label={"模板用途 " + resource(t.id)?.name}
                            hideLabel
                            value={t.use}
                            options={[
                              { value: "input", label: "输入组织" },
                              { value: "output", label: "产出结构" },
                            ]}
                            onChange={(e) =>
                              update({
                                templates: draft.templates.map((x, j) =>
                                  i === j ? { ...x, use: e.target.value } : x,
                                ),
                              })
                            }
                          />
                          <Action
                            label={"移除模板 " + resource(t.id)?.name}
                            icon="x"
                            onClick={() =>
                              update({
                                templates: draft.templates.filter(
                                  (_, j) => i !== j,
                                ),
                              })
                            }
                          />
                        </div>
                      ))}
                      {!draft.templates.length && (
                        <Typography variant="description" tone="muted">
                          尚未添加模板
                        </Typography>
                      )}
                    </div>
                  </Card>
                </div>
                <aside className="resource-usage">
                  <div className="resource-provenance">
                    <Typography variant="meta" tone="muted">
                      配置来源
                    </Typography>
                    <Typography as="p" variant="description">
                      {draft.origin || "直接创建"}
                    </Typography>
                    <span className="resource-version">当前工作流草稿</span>
                  </div>
                  <div className="resource-usage-title">
                    <Typography variant="label">引用活动</Typography>
                    <span className="resource-count">{refs.length}</span>
                  </div>
                  {refs.length ? (
                    <>
                      <Typography as="p" variant="description" tone="secondary">
                        修改此配置会影响以下活动。
                      </Typography>
                      <div className="resource-reference-list">
                        {refs.map((n) => (
                          <button
                            key={n.id}
                            data-resource-reference={n.id}
                            onClick={() => onLocate(n.id)}
                          >
                            <div>
                              <strong>{n.title}</strong>
                              <small>
                                {workflow?.nodes.find((x) => x.id === n.parent)
                                  ?.title || "工作流"}
                              </small>
                            </div>
                            <Icon name="arrow-up-right" />
                          </button>
                        ))}
                      </div>
                      <div className="resource-usage-note">
                        <Icon name="copy" />
                        <Typography variant="description" tone="muted">
                          只调整一个活动时，先复制配置，再到流程设计中重新绑定。
                        </Typography>
                      </div>
                    </>
                  ) : (
                    <div className="resource-unbound">
                      <Icon name="git-branch" />
                      <Typography variant="description" tone="muted">
                        尚未绑定活动
                      </Typography>
                      <Typography variant="meta" tone="muted">
                        配置好后，在流程设计中选择节点进行绑定。
                      </Typography>
                    </div>
                  )}
                  <div className="resource-assistance">
                    <Typography variant="label">检查与完善</Typography>
                    <Typography as="p" variant="description" tone="muted">
                      {dirty ? "当前修改待检查" : "尚未运行配置检查"}
                    </Typography>
                    <Button
                      appearance="ghost"
                      onClick={() => openChat("update")}
                    >
                      交给对话处理
                      <Icon name="arrow-up-right" />
                    </Button>
                  </div>
                </aside>
              </div>
            </div>
          </>
        )}
      </main>
      <dialog
        className="resource-dialog resource-content-dialog"
        ref={contentDialog}
        aria-label="资源内容"
      >
        <div className="resource-dialog-head">
          <div>
            <Typography variant="section-title">
              {resource(contentId)?.name}
            </Typography>
            <Typography as="p" variant="meta" tone="muted">
              v{resource(contentId)?.version} ·{" "}
              {draft.contents?.[contentId] ? "当前配置内草稿" : "资源内容预览"}
            </Typography>
          </div>
          <Action
            label="关闭资源内容"
            icon="x"
            onClick={() => contentDialog.current?.close()}
          />
        </div>
        <textarea
          className="resource-content-editor"
          aria-label="资源内容"
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
        />
        <div className="resource-dialog-actions">
          <Button
            appearance="ghost"
            onClick={() => {
              contentDialog.current?.close();
              openChat("update", contentId);
            }}
          >
            通过对话调整
          </Button>
          <Button
            onClick={() => {
              update({
                contents: { ...draft.contents, [contentId]: contentText },
              });
              contentDialog.current?.close();
            }}
          >
            应用内容草稿
          </Button>
        </div>
        <Typography variant="meta" tone="muted">
          只更新当前配置内的草稿，不覆盖共享资源版本。
        </Typography>
      </dialog>
      <section
        hidden={!authoringOpen}
        className="resource-authoring-panel"
        aria-label="配置候选工作面"
      >
        <div className="resource-dialog-head">
          <div>
            <Typography variant="section-title">
              {chatMode === "new"
                ? "从意图创建配置"
                : chatTarget
                  ? "调整 " + resource(chatTarget)?.name
                  : "调整 " + draft.name}
            </Typography>
            <Typography as="p" variant="meta" tone="muted">
              交互演示 · 未连接 Agent
            </Typography>
          </div>
          <Action
            label="返回配置"
            icon="x"
            onClick={() => setAuthoringOpen(false)}
          />
        </div>
        <div className="resource-authoring-grid">
          <section className="resource-authoring-input">
            {chatMode === "new" && (
              <div className="resource-authoring-fields">
                <label>
                  <Typography variant="label">配置名称</Typography>
                  <TextInput
                    type="text"
                    aria-label="对话创建的配置名称"
                    value={chatName}
                    onChange={(e) => {
                      setChatName(e.target.value);
                      setProposal(null);
                    }}
                  />
                </label>
                <SelectField
                  label="预期执行方式"
                  value={chatType}
                  options={[
                    { value: "agent", label: "Agent 执行" },
                    { value: "script", label: "Script 执行" },
                  ]}
                  onChange={(e) => {
                    setChatType(e.target.value as "agent" | "script");
                    setProposal(null);
                  }}
                />
              </div>
            )}
            <Typography as="p" variant="description" tone="secondary">
              在左侧对话中描述工作要求，右侧审阅候选后再应用。
            </Typography>
            {chatInput && (
              <div className="resource-change-block">
                <Typography variant="label">本次要求</Typography>
                <p>{chatInput}</p>
              </div>
            )}
            <Typography as="p" variant="meta" tone="muted">
              交互演示仅记录要求；尚未连接 Agent 或运行真实校验。
            </Typography>
          </section>
          <section className="resource-proposal" aria-label="修改候选">
            {proposal ? (
              <>
                <div className="resource-proposal-heading">
                  <Typography variant="section-title">
                    {chatMode === "new" ? "新配置候选" : "修改候选"}
                  </Typography>
                  <Chip>待实际校验</Chip>
                </div>
                <Typography as="p" variant="description">
                  {proposal.profile.name}
                </Typography>
                <ul>
                  {proposal.changes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <div className="resource-change-block">
                  <Typography variant="label">
                    {chatTarget
                      ? "内容追加"
                      : chatMode === "new"
                        ? "工作要求"
                        : "指令追加"}
                  </Typography>
                  <p>{proposal.request}</p>
                </div>
                <Typography as="p" variant="description" tone="secondary">
                  {proposal.profile.refs.length
                    ? "保存后影响 " +
                      proposal.profile.refs.length +
                      " 个引用活动"
                    : "尚未绑定活动"}
                </Typography>
                {chatError && <p role="alert">{chatError}</p>}
                <div className="resource-dialog-actions">
                  <Button appearance="ghost" onClick={() => setProposal(null)}>
                    放弃候选
                  </Button>
                  <Button onClick={applyProposal}>应用到编辑草稿</Button>
                </div>
              </>
            ) : (
              <div className="resource-proposal-empty">
                <Icon name="git-branch" size="content-marker" />
                <Typography variant="description" tone="muted">
                  候选内容将在这里显示
                </Typography>
                <Typography variant="meta" tone="muted">
                  当前配置不会直接被修改
                </Typography>
              </div>
            )}
          </section>
        </div>
      </section>
      <dialog
        className="resource-dialog resource-picker"
        ref={picker}
        aria-label={"选择" + typeLabels[pickerKind]}
      >
        <div className="resource-dialog-head">
          <Typography variant="section-title">
            选择{typeLabels[pickerKind]}
          </Typography>
          <Action
            label="关闭资源选择"
            icon="x"
            onClick={() => picker.current?.close()}
          />
        </div>
        <SearchField
          label="搜索资源"
          hideLabel
          placeholder="搜索名称或版本"
          value={pickerQuery}
          onChange={(e) => setPickerQuery(e.target.value)}
        />
        <div className="resource-picker-list">
          {catalog
            .filter(
              (r) =>
                r.kind === pickerKind &&
                (r.name + r.version)
                  .toLowerCase()
                  .includes(pickerQuery.toLowerCase()),
            )
            .map((r) => {
              const exists =
                pickerKind === "skill"
                  ? draft.skills.includes(r.id)
                  : pickerKind === "template"
                    ? draft.templates.some((t) => t.id === r.id)
                    : draft.primary === r.id;
              return (
                <button
                  key={r.id}
                  disabled={exists}
                  onClick={() => acceptResource(r)}
                >
                  <div>
                    <strong>{r.name}</strong>
                    <p>{r.description}</p>
                  </div>
                  <span>{exists ? "已选择" : "v" + r.version}</span>
                </button>
              );
            })}
          {!catalog.some(
            (r) =>
              r.kind === pickerKind &&
              (r.name + r.version)
                .toLowerCase()
                .includes(pickerQuery.toLowerCase()),
          ) && (
            <Typography variant="description" tone="muted">
              没有匹配的资源
            </Typography>
          )}
        </div>
      </dialog>
      <dialog className="resource-dialog" ref={dialog} aria-label="配置操作">
        <div className="resource-dialog-head">
          <Typography variant="section-title">
            {
              {
                new: "新建配置",
                copy: "复制配置",
                delete: "删除配置",
                switch: "切换执行方式",
                leave: "保留当前修改？",
                help: "资源配置",
              }[dialogMode]
            }
          </Typography>
          <Action
            label="关闭配置操作"
            icon="x"
            onClick={() => dialog.current?.close()}
          />
        </div>
        {(dialogMode === "new" || dialogMode === "copy") && (
          <>
            <label>
              <Typography variant="label">名称</Typography>
              <TextInput
                type="text"
                aria-label="新配置名称"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </label>
            {dialogMode === "new" ? (
              <SelectField
                label="新配置执行方式"
                value={newMode}
                options={[
                  { value: "agent", label: "Agent 执行" },
                  { value: "script", label: "Script 执行" },
                ]}
                onChange={(e) =>
                  setNewMode(e.target.value as "agent" | "script")
                }
              />
            ) : (
              <Typography variant="description" tone="secondary">
                复制当前内容，创建独立配置。已有活动仍引用原配置。
              </Typography>
            )}
            <div className="resource-dialog-actions">
              <Button disabled={!newName.trim()} onClick={addProfile}>
                {dialogMode === "copy" ? "创建副本" : "创建配置"}
              </Button>
            </div>
          </>
        )}
        {dialogMode === "switch" && (
          <>
            <Typography as="p" variant="description">
              切换为 {draft.mode === "agent" ? "Script" : "Agent"}{" "}
              执行后，将移除当前
              {draft.mode === "agent" ? "角色和技能" : "脚本及脚本参数"}
              。模板及其用途保留。
            </Typography>
            {draft.refs.length > 0 && (
              <Typography variant="description" tone="secondary">
                保存后影响 {draft.refs.length} 个引用活动；不改变引用关系。
              </Typography>
            )}
            <div className="resource-dialog-actions">
              <Button
                appearance="ghost"
                onClick={() => dialog.current?.close()}
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  update({
                    mode: draft.mode === "agent" ? "script" : "agent",
                    primary: "",
                    skills: [],
                    parameters: "",
                  });
                  dialog.current?.close();
                }}
              >
                切换为 {draft.mode === "agent" ? "Script" : "Agent"}
              </Button>
            </div>
          </>
        )}
        {dialogMode === "delete" && (
          <>
            <Typography variant="description">
              {draft.refs.length
                ? "该配置仍被 " +
                  draft.refs.length +
                  " 个活动引用。请先在流程设计中替换或解除绑定。"
                : "删除“" +
                  draft.name +
                  "”？此操作只删除本工作流中的配置，不删除资源本身。"}
            </Typography>
            <div className="resource-dialog-actions">
              <Button
                appearance="ghost"
                onClick={() => dialog.current?.close()}
              >
                取消
              </Button>
              <Button disabled={draft.refs.length > 0} onClick={remove}>
                确认删除
              </Button>
            </div>
          </>
        )}
        {dialogMode === "leave" && (
          <>
            <Typography variant="description">
              当前配置有未保存修改。
            </Typography>
            <div className="resource-dialog-actions">
              <Button
                appearance="ghost"
                onClick={() => {
                  select(nextId);
                  dialog.current?.close();
                }}
              >
                放弃修改并切换
              </Button>
              <Button
                onClick={() => {
                  if (save()) {
                    select(nextId);
                    dialog.current?.close();
                  }
                }}
              >
                保存并切换
              </Button>
            </div>
          </>
        )}
        {dialogMode === "help" && (
          <div className="resource-help">
            <Typography as="p" variant="description">
              按职责与指令、能力、确定性处理和输入产出组织配置。资源可来自初次对话、持续调整或结晶分析，再到活动节点上绑定。
            </Typography>
            <Typography as="p" variant="description">
              文档、校验、结构约束和执行适配由 Agent
              维护，页面只展示需要你判断的问题。查看资源内容时可直接编辑当前配置内的内容草稿，也可交给对话提出候选。
            </Typography>
            <Typography as="p" variant="description">
              共享配置的修改影响全部引用节点。需要局部变化时，复制配置并重新绑定。
            </Typography>
            <Typography as="p" variant="description" tone="muted">
              本页为交互预览，使用示例资源目录、配置来源和引用关系。对话是本地交互演示：将输入要求写入候选，不连接模型、不生成可执行程序或真实校验结论。保存仅在当前页面会话内生效；资源服务、正式版本及节点绑定写入尚未接入。
            </Typography>
          </div>
        )}
      </dialog>
    </section>
  );
}
