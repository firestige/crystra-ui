import { GateWorkbench } from "../components/crystra-ui/task-workbench/gate";
import { DeliveryWorkbench } from "../components/crystra-ui/task-workbench/delivery";
import { gatePreview, deliveryPreview } from "./review-delivery-fixture";
import { SettingsDialog } from "../components/crystra-dsh/settings/settings-dialog";
import { executionRpc } from "../execution-rpc";
import { ExecutionWorkbench } from "../components/crystra-ui/task-workbench/execution";
import { executionFrame, type PreviewPace } from "./execution-simulation";
import { ExecutionMap } from "../components/crystra-dsh/task-workbench/execution-map";
import planDraft from "../../../../wsr-contracts/docs/proposals/plan-json-ir/example.json";
import { PlanDraftView } from "../components/crystra-dsh/task-workbench/plan-draft-view";
import { GrillingWorkbench } from "../components/crystra-ui/task-workbench/grilling";
import { grillingPreview } from "./grilling-fixture";
import { TaskDetailPage } from "../components/crystra-ui/pages";
import { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "crystra-ui-core";
import {
  TaskWorkbench,
  type WorkbenchSurface,
} from "../components/crystra-ui/task-workbench/task-workbench";
import { WorkbenchAttentionBadge } from "../components/crystra-dsh/task-workbench/workbench-attention";
/** Isolated dev fixture: never supplies notifications to a real Task. */
export function Preview() {
  const [navigationContainer, setNavigationContainer] =
    useState<HTMLDivElement | null>(null);
  const [value, setValue] = useState<WorkbenchSurface>("gate");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState(gatePreview.items[0].id);
  const [invalidated, setInvalidated] = useState(false);
  const [emptyGates, setEmptyGates] = useState(false);
  const [tick, setTick] = useState(13);
  const [disconnected, setDisconnected] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [pace, setPace] = useState<PreviewPace>("normal");
  useEffect(() => {
    if (!playing || disconnected || pace === "error") return;
    const timer = setInterval(() => setTick((t) => Math.min(120, t + 1)), 1000);
    return () => clearInterval(timer);
  }, [playing, pace, disconnected]);
  const executionPreview = useMemo(() => {
    const frame = executionFrame(tick, pace);
    return disconnected
      ? { ...frame, monitor: { revision: tick + 1, status: "stale" as const } }
      : frame;
  }, [tick, pace, disconnected]);
  const [count, setCount] = useState(3);
  const [changed, setChanged] = useState(true);
  return (
    <main
      className="crystra-bi"
      data-crystra-theme="dark"
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      {settingsOpen && (
        <SettingsDialog
          rpc={executionRpc}
          onClose={() => setSettingsOpen(false)}
          onSaved={() => {}}
        />
      )}
      <TaskDetailPage
        title="任务通知预览"
        description="Task Workbench"
        navigation={<div ref={setNavigationContainer} />}
        chat={
          <div
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <Button onClick={() => setSettingsOpen(true)}>设置</Button>
            <p>审核回复目标：{emptyGates ? "无" : selectedGate}</p>
            <Button onClick={() => setEmptyGates(!emptyGates)}>
              {emptyGates ? "恢复待决队列" : "预览无待决项"}
            </Button>
            <Button onClick={() => setInvalidated(!invalidated)}>
              {invalidated ? "恢复交付快照" : "预览目标变更"}
            </Button>
            <p>执行数据预览 · {tick} 秒</p>
            <Button onClick={() => setDisconnected(!disconnected)}>
              {disconnected ? "恢复连接" : "模拟断线"}
            </Button>
            <Button onClick={() => setPlaying(!playing)}>
              {playing ? "暂停数据播放" : "继续数据播放"}
            </Button>
            <Button
              onClick={() => {
                setTick(0);
                setPace("normal");
                setPlaying(true);
              }}
            >
              重播执行预览
            </Button>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(
                [
                  ["normal", "正常"],
                  ["slow", "偏慢"],
                  ["fast", "快速"],
                  ["error", "异常"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  selected={pace === value}
                  onClick={() => {
                    setPace(value);
                    setTick(15);
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
            <p>通知状态预览控制</p>
            <Button onClick={() => setCount(0)}>标记通知已读</Button>
            <Button onClick={() => setChanged(false)}>标记变动已查看</Button>
            <Button
              onClick={() => {
                setCount(3);
                setChanged(true);
              }}
            >
              重置预览
            </Button>
          </div>
        }
        bench={
          <TaskWorkbench
            navigationContainer={navigationContainer}
            value={value}
            onValueChange={setValue}
            systemFocus="execution"
            panels={{
              grilling: <GrillingWorkbench data={grillingPreview} />,
              plan: <PlanDraftView draft={planDraft} />,
              gate: (
                <GateWorkbench
                  data={
                    emptyGates ? { revision: "empty", items: [] } : gatePreview
                  }
                  selectedId={emptyGates ? null : selectedGate}
                  onSelect={(id) => setSelectedGate(id)}
                />
              ),
              delivery: (
                <DeliveryWorkbench data={{ ...deliveryPreview, invalidated }} />
              ),
              execution: (
                <ExecutionWorkbench
                  data={executionPreview}
                  MapComponent={ExecutionMap}
                />
              ),
            }}
            navigationIndicators={{
              plan: (
                <WorkbenchAttentionBadge
                  changed={changed}
                  unreadCount={count}
                />
              ),
              gate: (
                <WorkbenchAttentionBadge
                  changed={false}
                  unreadCount={emptyGates ? 0 : gatePreview.items.length}
                />
              ),
            }}
          />
        }
      />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Preview />);
