import type { TaskDiagramNode } from "../domain/task-diagram";
import graphs from "./task-design-graphs.json";
import { TaskDiagram, TaskDiagramExplorer } from "../components/task-diagram";
/** Accepted v8 fixtures exercise the same public consumer used by the host. */
export function TaskDesignGraph({
  name,
  onSelect,
  query = "",
}: {
  name: keyof typeof graphs.graphs;
  onSelect?: (id: string) => void;
  query?: string;
}) {
  const diagram = graphs.graphs[name] as TaskDiagramNode,
    ids: string[] = [];
  const collect = (node: TaskDiagramNode | string) => {
    if (typeof node === "string") return;
    const id = node.props["data-dag-node"] ?? node.props["data-section-id"];
    if (
      id &&
      (node.props["data-node-label"] || id === "execution-plan-wave-1b")
    )
      ids.push(id);
    node.children.forEach(collect);
  };
  collect(diagram);
  return (
    <TaskDiagram
      diagram={diagram}
      label={
        name === "workflow"
          ? "工作流运行路径：已发生路径与下一步候选"
          : (diagram.props["aria-label"] ?? name)
      }
      selectableIds={ids}
      onSelect={onSelect}
      query={query}
    />
  );
}
export function TaskPlanDagExploration() {
  return (
    <TaskDiagramExplorer
      diagram={graphs.graphs.plan}
      label="可缩放和拖动的完整计划 DAG"
    />
  );
}
