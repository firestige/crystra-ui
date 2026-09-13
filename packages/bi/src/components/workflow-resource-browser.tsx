import { saveResourceContent } from "./resource-content";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { WorkflowMapIR } from "../domain/workflow-map-ir";
import "../dsh-document-theme.css";
import "../page-header.css";
import "../workflow-resource-browser.css";
import { Tabs } from "./collection-components";
import { Button, IconButton, Typography } from "./design-system";
import { Icon, type IconName } from "./icon";
import {
  resourceCatalog,
  resourceGroups,
  type ResourcePresentation,
} from "./resource-catalog";
import {
  applyResourceMutation,
  resourceDependents,
  type ResourceMutation,
} from "./resource-mutations";
import { ResourceRelationGraph } from "./resource-relation-graph";
import {
  ResourceSourceEditor,
  type ResourceEditorActions,
  type ResourceEditorStatus,
} from "./resource-source-editor";
import { SearchField } from "./state-components";
import { WidgetTooltip } from "./widget-tooltip";
type FileEntry = {
  path: string;
  content: string;
  truncated: boolean;
  internal: boolean;
  displayName?: string;
  presentation?: ResourcePresentation;
  imageData?: string;
};
type RefNode = {
  id: string;
  label: string;
  kind: string;
  file?: string;
  detail?: string;
};
type Edge = { from: string; to: string; label: string };
type Workspace = {
  title: string;
  root: string;
  version: string;
  files: FileEntry[];
  nodes: RefNode[];
  edges: Edge[];
};
declare global {
  interface Window {
    crystraResourceWorkspaces?: Workspace[];
    crystraRenderResourceMarkdown?: (text: string) => ReactNode;
  }
}
type Draft = { base: string; text: string };
const retainedDrafts = new Map<
  string,
  { selected: string; draft: Draft | null }
>();
function FileAction({
  label,
  icon,
  onClick,
  disabled = false,
  pressed,
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <WidgetTooltip text={label} focusable={disabled}>
      <IconButton
        appearance="ghost"
        aria-label={label}
        aria-pressed={pressed}
        disabled={disabled}
        onClick={onClick}
      >
        <Icon name={icon} />
      </IconButton>
    </WidgetTooltip>
  );
}
function ResourceGroup({
  name,
  query,
  initialOpen,
  children,
  onAdd,
}: {
  name: string;
  query: string;
  initialOpen: boolean;
  children: ReactNode;
  onAdd: () => void;
}) {
  const [open, setOpen] = useState(initialOpen),
    id = useId();
  const [previous, setPrevious] = useState({ query, initialOpen });
  if (previous.query !== query || previous.initialOpen !== initialOpen) {
    setPrevious({ query, initialOpen });
    if (query.trim() || initialOpen) setOpen(true);
  }
  return (
    <section className="wrb-resource-group">
      <h3 className="wrb-resource-group-heading" aria-label={name}>
        <button
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon
            name="chevron-down"
            style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          />
          <span>{name}</span>
        </button>
        <FileAction label={"添加" + name} icon="plus" onClick={onAdd} />
      </h3>
      <div
        id={id}
        className="wrb-resource-group-panel"
        data-open={open}
        inert={!open}
      >
        <div>{children}</div>
      </div>
    </section>
  );
}
export function WorkflowResourceBrowser({
  workflow,
}: {
  workflow: WorkflowMapIR;
}) {
  const workspace = window.crystraResourceWorkspaces?.find(
      (w) => w.title === workflow.title,
    ),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(
      () =>
        retainedDrafts.get(workflow.title)?.selected ||
        "roles/implementer.role.md",
    ),
    [tab, setTab] = useState("content"),
    help = useRef<HTMLDialogElement>(null);
  const file = workspace?.files.find((f) => f.path === selected) ||
    workspace?.files.find((f) => f.path.startsWith("roles/")) ||
    workspace?.files[0] || {
      path: "",
      content: "",
      truncated: false,
      internal: false,
    };
  const catalog = resourceCatalog(
    workspace?.files || [],
    workspace?.nodes,
    workspace?.edges,
  );
  const resources = catalog.filter((r) =>
    [r.name, r.purpose, ...r.files.map((f) => f.path)]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const resource = catalog.find((r) =>
    r.files.some((f) => f.path === file?.path),
  );
  const [draft, setDraft] = useState<Draft | null>(
      () => retainedDrafts.get(workflow.title)?.draft || null,
    ),
    [notice, setNotice] = useState(""),
    [conflict, setConflict] = useState(false),
    [editorSession, setEditorSession] = useState(0);
  const [editorStatus, setEditorStatus] = useState<ResourceEditorStatus>({
    line: 1,
    column: 1,
    lines: 1,
    selected: 0,
    canUndo: false,
    canRedo: false,
  });
  const [editingOpen, setEditingOpen] = useState(false),
    [resourceRevision, setResourceRevision] = useState(0);
  const [mutation, setMutation] = useState<ResourceMutation | null>(null),
    [resourceName, setResourceName] = useState(""),
    [newContent, setNewContent] = useState(""),
    [mutationError, setMutationError] = useState("");
  const management = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (mutation) management.current?.showModal();
  }, [mutation]);
  const baseline = useRef("");
  const editorActions = useRef<ResourceEditorActions>(null);
  const pending = useRef<(() => void) | null>(null),
    unsaved = useRef<HTMLDialogElement>(null),
    dirty = !!draft && draft.text !== draft.base;
  useEffect(() => {
    retainedDrafts.set(workflow.title, { selected, draft });
  }, [workflow.title, selected, draft]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (
        [...retainedDrafts.values()].some(
          (v) => v.draft && v.draft.text !== v.draft.base,
        )
      ) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, []);
  const discuss = () => {
    const input = document.querySelector<HTMLTextAreaElement>(
      '[data-host-owned="dsh-input"] textarea',
    );
    if (input && file) {
      input.value +=
        (input.value ? "\n\n" : "") +
        "请查看资源「" +
        (resource?.name || file.path.split("/").at(-1)) +
        "」，";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    }
  };
  if (!workspace)
    return <div className="wrb-empty">当前工作流尚未关联资源包。</div>;
  const save = () => {
    if (!draft || !dirty) return true;
    if (file.truncated) {
      setNotice("内容不完整，不能保存截断文件。");
      return false;
    }
    if (file.content !== draft.base) {
      setConflict(true);
      setNotice(
        "文件已被其他来源修改，当前草稿已保留；请查看最新内容后重新调整。",
      );
      return false;
    }
    try {
      saveResourceContent(workspace, file.path, draft.base, draft.text);
    } catch {
      setConflict(true);
      setNotice(
        "文件已被其他来源修改，当前草稿已保留；请查看最新内容后重新调整。",
      );
      return false;
    }
    setDraft({ base: draft.text, text: draft.text });
    setConflict(false);
    setNotice("已保存到页面样本 · 未写入磁盘");
    return true;
  };
  const selectFile = (path: string) => {
    if (path === file.path) return;
    const change = () => {
      setSelected(path);
      setEditingOpen(false);
      setDraft(null);
      setNotice("");
      setConflict(false);
    };
    if (dirty) {
      pending.current = change;
      unsaved.current?.showModal();
    } else change();
  };
  const manage = (next: ResourceMutation) => {
    const start = () => {
      setDraft(null);
      setConflict(false);
      setEditorSession((s) => s + 1);
      setMutation(next);
      setResourceName(next.resource?.name || "");
      setNewContent("");
      setMutationError("");
    };
    if (dirty) {
      pending.current = start;
      unsaved.current?.showModal();
    } else start();
  };
  const commitMutation = () => {
    if (!mutation) return;
    try {
      const event = applyResourceMutation(
        workspace,
        mutation,
        resourceName,
        newContent,
      );
      setResourceRevision((v) => v + 1);
      if (mutation.kind === "add") {
        setSelected(event.path);
        setQuery("");
      } else if (
        mutation.kind === "delete" &&
        mutation.resource?.files.some((f) => f.path === file.path)
      ) {
        setSelected(
          resourceCatalog(workspace.files, workspace.nodes, workspace.edges)[0]
            ?.path || "",
        );
        setQuery("");
      }
      setDraft(null);
      setEditingOpen(false);
      setNotice(
        "资源变更已更新页面样本；已生成 Agent 通知事件，尚未连接运行时。",
      );
      setMutation(null);
      management.current?.close();
    } catch (e) {
      setMutationError((e as Error).message);
    }
  };
  const changeTab = (next: string) => setTab(next);
  const cancel = () => {
    setDraft(null);
    setConflict(false);
    setNotice("");
    setEditorSession((s) => s + 1);
  };
  const text = draft?.text ?? file.content;
  const markdown = /\.(md|markdown)$/i.test(file.path),
    image = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(file.path),
    canEdit = !image && !file.truncated;
  const effectiveMode = image
      ? "preview"
      : markdown
        ? editingOpen
          ? "split"
          : "preview"
        : "edit",
    showEditor =
      !!file.path && tab === "content" && effectiveMode !== "preview",
    showPreview = tab === "content" && effectiveMode !== "edit";
  return (
    <section
      className="wrb crystra-bi"
      data-crystra-theme="dark"
      data-ui-owner="components"
      data-section-id="workflow-resource-browser"
    >
      <aside className="wrb-files" aria-label="工作流资源">
        <header>
          <Typography variant="section-title">资源</Typography>
          <WidgetTooltip text="资源与引用说明">
            <IconButton
              appearance="ghost"
              aria-label="资源与引用说明"
              onClick={() => help.current?.showModal()}
            >
              <Icon name="help" />
            </IconButton>
          </WidgetTooltip>
        </header>
        <SearchField
          label="搜索资源文件"
          hideLabel
          placeholder="搜索资源"
          leading={<Icon name="search" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <nav aria-label="工作流资源列表">
          {resourceGroups.map((group) => {
            const entries = resources.filter((r) => r.group === group);
            return entries.length || !query.trim() ? (
              <ResourceGroup
                key={group}
                name={group}
                query={query}
                initialOpen={resource?.group === group}
                onAdd={() => manage({ kind: "add", group })}
              >
                <ul className="wrb-tree">
                  {entries.map((r) => (
                    <li
                      key={r.path}
                      className="wrb-resource-item"
                      data-selected={resource?.path === r.path}
                    >
                      <button
                        className="wrb-file-row"
                        aria-label={"打开文件 " + r.path}
                        aria-current={
                          resource?.path === r.path ? "true" : undefined
                        }
                        onClick={() => selectFile(r.path)}
                      >
                        <span>{r.name}</span>
                      </button>
                      <FileAction
                        label={"删除" + r.name}
                        icon="trash"
                        onClick={() =>
                          manage({
                            kind: "delete",
                            group: r.group,
                            resource: r,
                          })
                        }
                      />
                    </li>
                  ))}
                </ul>
              </ResourceGroup>
            ) : null;
          })}
          {!resources.length && <p className="wrb-empty">没有匹配的资源</p>}
        </nav>
      </aside>
      <main className="wrb-inspector">
        <div
          className="wrb-document-surface"
          data-section-id="resource-document-surface"
        >
          <header
            className="wrb-file-header wb-header wb-page-header studio-header"
            data-section-id="resource-detail-header"
          >
            <div className="wrb-file-identity" data-header-slot="identity">
              <Typography as="h2" variant="page-title">
                {resource?.name ||
                  file.path.split("/").at(-1) ||
                  "尚未选择资源"}
              </Typography>
              <Typography as="p" variant="description" tone="secondary">
                {resource?.group || "附属内容"}
              </Typography>
            </div>
            <div data-header-slot="navigation">
              <Tabs
                appearance="underline"
                aria-label="资源详情"
                value={tab}
                onValueChange={changeTab}
                items={[
                  { value: "content", label: "内容", panel: null },
                  { value: "refs", label: "关联图", panel: null },
                ]}
              />
            </div>
            <div
              data-header-slot="context"
              className="wrb-save-actions"
              role="group"
              aria-label="文件操作"
            >
              {resource && (
                <div
                  className="wrb-action-cluster"
                  role="group"
                  aria-label="资源名称"
                >
                  <FileAction
                    label="重命名资源"
                    icon="pencil"
                    onClick={() =>
                      manage({
                        kind: "rename",
                        group: resource.group,
                        resource,
                      })
                    }
                  />
                </div>
              )}
              <div
                className="wrb-action-cluster"
                role="group"
                aria-label="对话引用"
              >
                <FileAction
                  label="在对话中讨论此文件"
                  icon="message-plus"
                  onClick={discuss}
                />
              </div>
              <div
                className="wrb-action-cluster"
                role="group"
                aria-label="查找"
              >
                <FileAction
                  label="查找 / 替换"
                  icon="search"
                  disabled={!showEditor || !canEdit}
                  onClick={() => editorActions.current?.find()}
                />
              </div>
              <div
                className="wrb-action-cluster"
                role="group"
                aria-label="编辑历史"
              >
                <FileAction
                  label="撤销"
                  icon="arrow-back-up"
                  disabled={!showEditor || !canEdit || !editorStatus.canUndo}
                  onClick={() => editorActions.current?.undo()}
                />
                <FileAction
                  label="重做"
                  icon="arrow-forward-up"
                  disabled={!showEditor || !canEdit || !editorStatus.canRedo}
                  onClick={() => editorActions.current?.redo()}
                />
              </div>
              <div
                className="wrb-action-cluster"
                role="group"
                aria-label="保存修改"
              >
                <FileAction
                  label="取消"
                  icon="x"
                  disabled={!canEdit || !dirty}
                  onClick={cancel}
                />
                <FileAction
                  label="保存"
                  icon="device-floppy"
                  disabled={!canEdit || !dirty || conflict}
                  onClick={() => save()}
                />
              </div>
            </div>
          </header>
          {resource && (
            <div className="wrb-resource-context">
              {resource.purpose && <p>{resource.purpose}</p>}
              {resource.files.length > 1 && (
                <details>
                  <summary>
                    {resource.group === "脚本／工具" ? "实现信息" : "附属内容"}
                  </summary>
                  <label>
                    查看内容
                    <select
                      aria-label={
                        resource.group === "脚本／工具"
                          ? "工具内容"
                          : "能力包文件"
                      }
                      value={file.path}
                      onChange={(e) => selectFile(e.target.value)}
                    >
                      {resource.files.map((f) => (
                        <option key={f.path} value={f.path}>
                          {f.path === resource.path
                            ? resource.group === "脚本／工具"
                              ? "工具说明"
                              : "能力说明"
                            : f.content.match(/^#\s+(.+)$/m)?.[1] ||
                              f.path.split("/").at(-1)}
                        </option>
                      ))}
                    </select>
                  </label>
                </details>
              )}
              <details>
                <summary>存储信息</summary>
                <span>{file.path}</span>
              </details>
            </div>
          )}
          {notice && (
            <div
              role={conflict ? "alert" : "status"}
              className="wrb-save-notice"
            >
              {notice}
              {conflict && (
                <details>
                  <summary>查看最新内容</summary>
                  <pre>{file.content}</pre>
                  <Button
                    appearance="ghost"
                    onClick={() => {
                      setDraft({ base: file.content, text: draft!.text });
                      setConflict(false);
                      setNotice("已更新比较基线，请核对草稿后保存。");
                    }}
                  >
                    已核对，保留我的草稿继续编辑
                  </Button>
                </details>
              )}
            </div>
          )}
          <div
            className="wrb-content-layout"
            data-view={effectiveMode}
            hidden={tab !== "content"}
          >
            {!file.path && <p className="wrb-empty">从左侧添加资源</p>}
            {!image && (
              <section className="wrb-editor-area" hidden={!showEditor}>
                <ResourceSourceEditor
                  onStatus={setEditorStatus}
                  ref={editorActions}
                  key={file.path + editorSession}
                  path={file.path}
                  initialText={text}
                  readOnly={!canEdit}
                  onMount={(base) => {
                    baseline.current = base;
                  }}
                  onChange={(text) =>
                    setDraft((d) => ({
                      base: d?.base ?? baseline.current,
                      text,
                    }))
                  }
                  onSave={() => save()}
                />
              </section>
            )}
            {(markdown || image) && (
              <section
                className="wrb-content"
                hidden={!showPreview}
                role="region"
                aria-label="文件内容"
              >
                {markdown && (
                  <div className="wrb-preview-toggle">
                    <WidgetTooltip text={editingOpen ? "收起编辑" : "开启编辑"}>
                      <IconButton
                        appearance="ghost"
                        aria-label={editingOpen ? "收起编辑" : "开启编辑"}
                        disabled={!canEdit}
                        aria-expanded={editingOpen}
                        onClick={() => setEditingOpen((open) => !open)}
                      >
                        <Icon name="pencil" />
                      </IconButton>
                    </WidgetTooltip>
                  </div>
                )}
                {image ? (
                  file.imageData ? (
                    <img
                      className="wrb-image"
                      src={file.imageData}
                      alt={file.path.split("/").at(-1)}
                    />
                  ) : (
                    <p>当前快照未包含该图片。</p>
                  )
                ) : (
                  <div data-document-markdown>
                    {window.crystraRenderResourceMarkdown?.(text) ?? (
                      <pre>{text}</pre>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
          {file.truncated && tab === "content" && (
            <p className="wrb-save-notice">
              文件过长，仅展示前 300,000 字符，不能编辑。
            </p>
          )}
          {tab === "refs" ? (
            <ResourceRelationGraph
              key={(resource?.id || file.path) + resourceRevision}
              source={workspace}
              file={resource?.path || file.path}
              onOpenFile={selectFile}
            />
          ) : null}
          {showEditor && (
            <footer className="wrb-editor-footer" aria-label="编辑状态">
              <span data-editor-position>
                行 {editorStatus.line}，列 {editorStatus.column}
              </span>
              {editorStatus.selected > 0 && (
                <span>已选 {editorStatus.selected} 字符</span>
              )}
              <span className="wrb-draft-status">
                {dirty ? "未保存修改" : "无未保存修改"}
              </span>
              <span className="wrb-editor-line-count">
                共 {editorStatus.lines} 行
              </span>
            </footer>
          )}
        </div>
      </main>
      <dialog
        ref={management}
        className="wrb-help wrb-management"
        aria-label="管理资源"
        onCancel={() => setMutation(null)}
      >
        {mutation && (
          <>
            <Typography as="h2" variant="section-title">
              {mutation.kind === "add"
                ? "添加" + mutation.group
                : mutation.kind === "rename"
                  ? "重命名资源"
                  : "删除资源"}
            </Typography>
            {mutation.kind === "delete" ? (
              <>
                <p>
                  删除「{mutation.resource?.name}」
                  {mutation.resource && mutation.resource.files.length > 1
                    ? "及其全部包内文件"
                    : ""}
                  ？
                </p>
                {mutation.resource &&
                resourceDependents(workspace, mutation.resource).refs.length >
                  0 ? (
                  <div role="alert">
                    <p>
                      存在引用，暂不能删除。请先在对应活动中解除或替换绑定。
                    </p>
                    <ul>
                      {resourceDependents(
                        workspace,
                        mutation.resource,
                      ).refs.map((e, i) => (
                        <li key={i}>
                          {workspace.nodes.find((n) => n.id === e.from)
                            ?.label || e.from}{" "}
                          · {e.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p>当前声明索引未发现外部引用。</p>
                )}
              </>
            ) : (
              <label>
                资源名称
                <input
                  aria-label="资源名称"
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                />
              </label>
            )}
            {mutation.kind === "add" && (
              <label>
                初始内容
                <textarea
                  aria-label="初始内容"
                  rows={7}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </label>
            )}
            {mutation.kind === "rename" && (
              <p>修改显示名称，保留资源标识、文件路径和已有引用。</p>
            )}
            {mutationError && <p role="alert">{mutationError}</p>}
            <div className="wrb-dialog-actions">
              <Button
                appearance="ghost"
                onClick={() => {
                  setMutation(null);
                  management.current?.close();
                }}
              >
                取消
              </Button>
              <Button
                disabled={
                  mutation.kind === "delete"
                    ? !!mutation.resource &&
                      resourceDependents(workspace, mutation.resource).refs
                        .length > 0
                    : !resourceName.trim()
                }
                onClick={commitMutation}
              >
                {mutation.kind === "delete"
                  ? "确认删除"
                  : mutation.kind === "add"
                    ? "创建资源"
                    : "保存名称"}
              </Button>
            </div>
          </>
        )}
      </dialog>
      <dialog
        ref={unsaved}
        className="wrb-help"
        aria-labelledby="wrb-unsaved-title"
      >
        <Typography as="h2" variant="section-title" id="wrb-unsaved-title">
          尚未保存
        </Typography>
        <p>切换文件前，保存或放弃当前修改。</p>
        <div className="wrb-dialog-actions">
          <Button
            appearance="ghost"
            onClick={() => {
              pending.current = null;
              unsaved.current?.close();
            }}
          >
            继续编辑
          </Button>
          <Button
            appearance="ghost"
            onClick={() => {
              pending.current?.();
              pending.current = null;
              unsaved.current?.close();
            }}
          >
            放弃修改
          </Button>
          <Button
            onClick={() => {
              if (save()) {
                pending.current?.();
                pending.current = null;
                unsaved.current?.close();
              } else unsaved.current?.close();
            }}
          >
            保存并切换
          </Button>
        </div>
      </dialog>
      <dialog ref={help} className="wrb-help">
        <Typography as="h2" variant="section-title">
          资源与引用
        </Typography>
        <p>
          资源文件来自当前工作流包。点击文件查看内容，切换到关联图追溯活动与资源，也可查看文件引用的其他资源。
        </p>
        <p>
          “可用执行配置”表示定义允许使用，不代表某次运行实际采用。“随能力包提供”表示目录归属，不代表该文件被单独执行。调用边表示配置允许的调用关系，引用边表示静态资源依赖；均不是运行记录。
        </p>
        <p>
          当前预览使用生成时的文件快照。编辑保存只更新页面样本，不写入磁盘；刷新将恢复快照。尚未连接
          Agent
          下载、真实文件保存与实时刷新。流程图是简化样本，此处展示静态声明的活动资源关系。
        </p>
        <Button onClick={() => help.current?.close()}>知道了</Button>
      </dialog>
    </section>
  );
}
