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
      id: `${profile.id}:evidence:${index}`,
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
  const data = profiles.find((profile) => profile.id === selectedId)!;
  return (
    <TaskGatePanel
      queue={profiles}
      selectedId={selectedId}
      data={data}
      onSelect={setSelectedId}
    />
  );
}
