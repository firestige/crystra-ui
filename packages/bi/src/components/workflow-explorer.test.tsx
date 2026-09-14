import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { WorkflowExplorer } from "./workflow-explorer";
it("keeps exact revisions through view changes and does not expose unsupported mutations", () => {
  const open = vi.fn();
  render(
    <WorkflowExplorer
      entries={[
        {
          definitionId: "def:a",
          revision: "r1",
          title: "Same",
          isLatest: false,
        },
        {
          definitionId: "def:a",
          revision: "r2",
          title: "Same",
          isLatest: true,
        },
      ]}
      onOpen={open}
    />,
  );
  expect(
    screen.getAllByRole("button", { name: "打开工作流：Same，r2" }),
  ).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "全部版本" }));
  fireEvent.click(
    screen.getByRole("button", { name: "工作流视图：Gallery，切换到 List" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "打开工作流：Same，r1" }));
  expect(open).toHaveBeenCalledWith("def:a", "r1");
  expect(screen.getByRole("button", { name: "新建工作流" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "归档所选" })).toBeDisabled();
  expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
});
it("distinguishes unavailable directory from an empty authoritative collection", () => {
  render(
    <WorkflowExplorer entries={[]} phase="unavailable" onOpen={() => {}} />,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "工作流目录接口尚未接入",
  );
  expect(screen.queryByText("0 项工作流")).not.toBeInTheDocument();
});
