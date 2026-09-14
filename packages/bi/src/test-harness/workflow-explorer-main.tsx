import { createRoot } from "react-dom/client";
import { useState } from "react";
import {
  BiSurface,
  CrystraShell,
  WorkflowExplorer,
  type WorkflowDefinitionEntry,
} from "../public";
const entries: WorkflowDefinitionEntry[] = Array.from({ length: 48 }, (_, i) =>
  [1, 2, 3].map(
    (revision) =>
      ({
        definitionId: `workflow-design-${i + 1}`,
        revision: `r${revision}`,
        title: `导入校验工作流 ${i + 1}`,
        purpose: "检查输入，验证结果并整理交付",
        isLatest: revision === 3,
        status: revision === 3 ? "DRAFT" : "CONFIRMED",
        createdAt: "2026-09-08T12:00:00Z",
        updatedAt: new Date(Date.UTC(2026, 8, 9) - i * 60000).toISOString(),
        nodeCount: 8 + (i % 12),
      }) as WorkflowDefinitionEntry,
  ),
).flat();
export function Scenario() {
  const [opened, setOpened] = useState("");
  const [saved, setSaved] = useState<string>();
  const [mount, setMount] = useState(0);
  return (
    <BiSurface
      theme="dark"
      data-crystra-theme="dark"
      className="workflow-explorer-test"
    >
      <style>
        {
          '.workflow-explorer-test{height:100vh}.workflow-explorer-test [role="note"]{position:fixed;bottom:4px;right:8px;z-index:100;background:#17253a;padding:4px;font-size:11px}'
        }
      </style>
      <CrystraShell
        route="workflows"
        tasks={[]}
        workflows={[]}
        onNavigate={() => {}}
        onOpenHarness={() => {}}
        onNewTask={() => {}}
        onOpenSettings={() => {}}
      >
        <WorkflowExplorer
          key={mount}
          initialViewState={saved}
          onViewStateChange={setSaved}
          entries={entries}
          onOpen={(id, revision) => setOpened(`${id}@${revision}`)}
        />
      </CrystraShell>
      <div role="note">
        <button onClick={() => setMount((n) => n + 1)}>
          模拟返回工作流目录
        </button>
        草案探索 · 独立设计测试数据{opened ? ` · 已选择 ${opened}` : ""}
      </div>
    </BiSurface>
  );
}
createRoot(document.getElementById("root")!).render(<Scenario />);
