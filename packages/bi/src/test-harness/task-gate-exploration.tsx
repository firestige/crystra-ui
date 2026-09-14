import { TaskEvidenceContext } from "../components/task-evidence-context";
import { taskGateContexts } from "./task-gate-contexts";
import { taskGateEvidenceFields } from "./task-gate-evidence-fields";
import { useState } from "react";
import {
  TaskGatePanel,
  type TaskGateProjection,
} from "../components/task-gate-panel";
import { taskGateProfiles } from "./task-gate-profiles";

const profiles: TaskGateProjection[] = Object.values(taskGateProfiles).map(
  (profile) => ({
    ...profile,
    evidence: profile.evidence.map(([title, detail, action, tone], index) => ({
      id: `${profile.id}:${taskGateEvidenceFields[index]![3].replace("gate-evidence-", "")}`,
      title,
      detail,
      action,
      tone,
    })),
  }),
);
/** Conditional design exploration only; no approval or runtime mutation. */
export function TaskGateExploration() {
  const [selectedId, setSelectedId] = useState(profiles[0]!.id);
  const [contextId, setContextId] = useState<string>();
  const data = profiles.find((profile) => profile.id === selectedId)!;
  if (contextId) {
    const key = selectedId
      .toLowerCase()
      .replace("-", "") as keyof typeof taskGateContexts;
    const field = contextId.slice(selectedId.length + 1);
    const contexts: Record<string, readonly string[]> = taskGateContexts[key];
    const item = contexts[field];
    return (
      <TaskEvidenceContext
        onBack={() => setContextId(undefined)}
        data={
          item
            ? {
                id: contextId,
                kind: item[0]!,
                title: item[1]!,
                summary: item[2]!,
                sections: [
                  { title: item[3]!, body: item[4]! },
                  { title: item[5]!, body: item[6]! },
                ],
                references: item[7]!,
              }
            : {
                id: contextId,
                kind: "设计探索",
                title: "精确跨页关联尚未接入",
                summary:
                  "这条证据要求携带精确计划或 Trace 身份跳转；当前探索适配器尚未提供该关联。",
                sections: [],
                references: contextId,
              }
        }
      />
    );
  }
  return (
    <TaskGatePanel
      queue={profiles}
      selectedId={selectedId}
      data={data}
      onSelect={setSelectedId}
      onInspect={setContextId}
    />
  );
}
