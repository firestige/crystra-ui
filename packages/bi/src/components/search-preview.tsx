import { ExpandableSearchField } from "./expandable-search-field";
import { useRef, useState } from "react";
import { Card, TextInput, Typography } from "./design-system";
import { Icon } from "./icon";
import { SearchField } from "./state-components";
import cases from "../search-preview-cases.json";

function SidebarSearch({ workflow = false }: { workflow?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const action = useRef<HTMLButtonElement>(null);
  const label = workflow ? "工作流" : "任务";
  const close = () => { setQuery(""); setOpen(false); setTimeout(() => action.current?.focus(), 0); };
  return <div className="search-sample-sidebar" data-open={open}>
    {!open && <span className="search-sample-sidebar-title"><Icon name="chevron-down" />{label}</span>}
    <button ref={action} aria-label={`搜索${label}`} aria-expanded={open} onClick={() => setOpen(true)}><Icon name="search" /></button>
    {open && <><input autoFocus aria-label={`搜索${label}`} placeholder={`搜索${label}…`} maxLength={500} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Escape") close(); }} /><button aria-label="关闭搜索" onClick={close}>×</button></>}
  </div>;
}
const notes: Record<string, string> = {
  "sidebar-task": "标题内展开 · 放大镜 · 关闭按钮 · 13px",
  "sidebar-workflow": "同一侧栏形式，保留工作流文案",
  "task-browser": "放大镜 · 常驻输入 · 聚焦时改变边框 · 14px",
  "workflow-browser": "同一浏览器形式，保留工作流文案",
  "plan-dag": "文字前缀「搜索」 · 较短输入框",
  "trace-directory": "放大镜 · 36px 高 · 聚焦时外描边 · 12px",
  "trace-timeline": "无前缀图标 · 英文 placeholder · TextInput",
};
export function SearchPreview() {
  return <><section id="search-candidate" className="preview-stack">
    <Typography as="h2" variant="section-title">搜索控件 · 统一检索组件 · 已确认</Typography>
    <Typography as="p" variant="description" tone="secondary">统一反馈：悬停时底色略亮；获得焦点时灰度表面进一步提亮、阴影加深。没有蓝色外框或内部方框。点击或 Tab 均可体验。</Typography>
    <div className="search-sample-grid">
      <Card heading="纯输入框"><div className="search-sample-stage"><SearchField appearance="surface" hideLabel label="搜索调用名称或精确标识" placeholder="搜索调用名称或精确标识…" /></div></Card>
      <Card heading="图标前缀"><div className="search-sample-stage"><SearchField appearance="surface" hideLabel label="搜索资源" leading={<Icon name="search" />} placeholder="搜索任务、目标或 Workspace…" /></div></Card>
      <Card heading="文字前缀"><div className="search-sample-stage"><SearchField appearance="surface" hideLabel label="搜索节点" leading="搜索" placeholder="节点名称或标识…" /></div></Card>
      <Card heading="展开式搜索"><div className="search-sample-stage"><ExpandableSearchField title={<><Icon name="chevron-down" />任务</>} label="搜索任务" placeholder="搜索任务…" /></div></Card>
      <Card heading="框外标签 · 已有内容"><div className="search-sample-stage"><SearchField appearance="surface" label="搜索条目" defaultValue="Delivery" leading={<Icon name="search" />} /></div></Card>
      <Card heading="禁用"><div className="search-sample-stage"><SearchField appearance="surface" hideLabel label="不可用的搜索" disabled leading={<Icon name="search" />} placeholder="搜索暂不可用" /></div></Card>
    </div>
  </section><details><summary>展开原有搜索形式（现状对照，非候选）</summary><section id="search-inventory" className="preview-stack">
    <Typography as="h2" variant="section-title">搜索控件 · 现有视觉对照</Typography>
    <Typography as="p" variant="description" tone="secondary">来自 5 个 v8 页面，共 7 个入口。仅展示搜索控件；可输入、聚焦，或展开侧栏搜索，比较当前视觉。</Typography>
    <div className="search-sample-grid">
      <Card heading="组件样本 · SearchField" description="现有「搜索、筛选与选择」中的组件">
        <div className="search-sample-stage"><SearchField label="搜索条目" size="compact" /></div>
      </Card>
      {cases.map(sample => <Card key={sample.id} heading={sample.title} description={notes[sample.id]}>
        <div className="search-sample-stage" data-search-sample={sample.id}>
          {sample.id.startsWith("sidebar-") ? <SidebarSearch workflow={sample.id === "sidebar-workflow"} /> :
          sample.id === "trace-timeline" ? <TextInput aria-label="Search recorded spans" placeholder="Search span name or exact identity" className="search-sample-timeline" /> :
          sample.id === "plan-dag" ? <label className="search-sample-dag"><span>搜索</span><input type="search" aria-label="搜索 DAG 节点" placeholder="节点名称或标识" /></label> :
          <label className={sample.id === "trace-directory" ? "search-sample-directory" : "search-sample-browser"}>
            <Icon name="search" /><input type={sample.id === "trace-directory" ? "text" : "search"} aria-label={sample.title} placeholder={sample.id === "trace-directory" ? "搜索 Task、版本或 Delivery…" : sample.id === "task-browser" ? "搜索任务、目标或 Workspace…" : "搜索工作流、用途或版本…"} />
          </label>}
        </div>
        <div className="search-sample-source">{sample.page}</div>
      </Card>)}
    </div>
  </section></details></>;
}
