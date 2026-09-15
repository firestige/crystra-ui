import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import graphs from "../test-harness/task-design-graphs.json";
import { TaskDiagram } from "./task-diagram";
import { isTaskDiagram } from "../domain/task-diagram";

describe("exact supplied task diagrams", () => {
  it("uses the accepted summary drawing rather than a disclosure icon", () => {
    expect(graphs.graphs.summary.props.viewBox).toBe("0 0 760 250");
    for (const graph of Object.values(graphs.graphs))
      expect(isTaskDiagram(graph)).toBe(true);
  });
  it("rejects active content, event handlers and external SVG references", () => {
    for (const tree of [
      { tag: "script", props: {}, children: ["bad()"] },
      {
        tag: "svg",
        props: { viewBox: "0 0 10 10", onLoad: "bad()" },
        children: [],
      },
      {
        tag: "svg",
        props: { viewBox: "0 0 10 10", fill: "url(https://invalid.example/a)" },
        children: [],
      },
    ])
      expect(isTaskDiagram(tree)).toBe(false);
  });
  it("only activates explicitly mapped nodes and retains keyboard navigation", () => {
    const select = vi.fn();
    render(
      <TaskDiagram
        diagram={graphs.graphs.execution}
        label="Execution"
        selectableIds={["execution-plan-wave-1b"]}
        onSelect={select}
      />,
    );
    fireEvent.keyDown(
      screen.getByRole("button", { name: "查看批次 1B 的工作流运行" }),
      { key: "Enter" },
    );
    expect(select).toHaveBeenCalledWith("execution-plan-wave-1b");
    expect(screen.getByRole("img", { name: "Execution" })).toBeTruthy();
  });
});
