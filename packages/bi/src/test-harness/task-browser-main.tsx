import { createRoot } from "react-dom/client";
import { useState } from "react";
import {
  BiSurface,
  CrystraShell,
  TaskBrowser,
  type BrowserTaskRecord,
} from "../public";
const tasks: BrowserTaskRecord[] = Array.from({ length: 60 }, (_, i) => ({
  id: `task-design-${i + 1}`,
  title: `校验资源导入结果 · ${i + 1}`,
  goal: "保留当前上下文，推进这一轮目标与检查",
  workspace: {
    name: `Workspace ${Math.floor(i / 20) + 1}`,
    path: `/exploration/workspace-${Math.floor(i / 20) + 1}`,
  },
  active: i % 4 !== 3,
  status: {
    label: ["运行中", "需要关注", "已停止", "暂无活动"][i % 4]!,
    tone: (["success", "warning", "danger", "neutral"] as const)[i % 4]!,
  },
  attention: {
    count: i % 5 === 0 ? 12 : i % 3,
    severity: i % 4 === 2 ? "error" : "warning",
  },
  progress:
    i % 4 === 3
      ? null
      : {
          completed: 3 + (i % 8),
          total: 12,
          scope: "当前 Plan Run 的执行单元",
        },
  createdAt: "2026-09-08T12:00:00.000Z",
  lastActivityAt: new Date(Date.UTC(2026, 8, 8, 14) - i * 60000).toISOString(),
  cost: i === 4 ? null : 4.8 + i * 2.37,
}));
export function Scenario() {
  const [opened, setOpened] = useState<string>();
  const [viewState, setViewState] = useState<string>();
  return (
    <BiSurface
      theme="dark"
      data-crystra-theme="dark"
      className="task-browser-exploration"
    >
      <style>
        {
          '.task-browser-exploration{height:100vh}.task-browser-exploration [data-section-id="product-page"]{position:relative}.task-browser-sample-note{position:fixed;right:8px;bottom:4px;z-index:100;font-size:11px;padding:4px;background:#17253a}'
        }
      </style>
      <CrystraShell
        route="tasks"
        tasks={[]}
        workflows={[]}
        onNavigate={() => {}}
        onOpenHarness={() => {}}
        onNewTask={() => {}}
        onOpenSettings={() => {}}
      >
        {opened ? (
          <section>
            <h1>{opened}</h1>
            <button onClick={() => setOpened(undefined)}>返回任务目录</button>
          </section>
        ) : (
          <TaskBrowser
            tasks={tasks}
            initialViewState={viewState}
            onViewStateChange={setViewState}
            onOpen={setOpened}
            onNewTask={() => setOpened("new-draft")}
          />
        )}
        <p role="note" className="task-browser-sample-note">
          设计样本 · 非真实任务{opened ? ` · 已选择 ${opened}` : ""}
        </p>
      </CrystraShell>
    </BiSurface>
  );
}
createRoot(document.getElementById("root")!).render(<Scenario />);
