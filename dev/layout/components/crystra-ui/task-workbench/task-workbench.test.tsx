import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { TaskWorkbench, type WorkbenchSurface } from "./task-workbench";
afterEach(cleanup);
it("browses all five surfaces without moving system focus or unmounting content", async () => {
  function Harness() {
    const [surface, setSurface] = useState<WorkbenchSurface>("grilling");
    return (
      <TaskWorkbench
        value={surface}
        onValueChange={setSurface}
        systemFocus="execution"
        panels={{
          grilling: (
            <input aria-label="projection state" defaultValue="retained" />
          ),
          plan: <p>Plan revision 4</p>,
        }}
      />
    );
  }
  render(<Harness />);
  const user = userEvent.setup();
  expect(screen.getAllByRole("tab")).toHaveLength(5);
  await user.click(screen.getByRole("tab", { name: "计划" }));
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Plan revision 4");
  expect(screen.getByRole("tab", { name: /执行/ })).toHaveTextContent(
    "系统当前",
  );
  expect(screen.getByRole("tab", { name: /执行/ })).toHaveAttribute(
    "aria-selected",
    "false",
  );
  await user.click(screen.getByRole("tab", { name: "需求" }));
  expect(screen.getByRole("textbox", { name: "projection state" })).toHaveValue(
    "retained",
  );
});
it("keeps unknown data distinct from confirmed empty gates and deliverability", async () => {
  const { rerender } = render(
    <TaskWorkbench value="gate" onValueChange={() => {}} />,
  );
  expect(screen.getByRole("tabpanel")).toHaveTextContent("审核信息尚不可用");
  expect(screen.queryByText("没有待裁决内容")).not.toBeInTheDocument();
  expect(screen.queryByText("系统当前")).not.toBeInTheDocument();
  rerender(<TaskWorkbench value="delivery" onValueChange={() => {}} />);
  expect(screen.getByRole("tabpanel")).toHaveTextContent("可交付性尚不可用");
});

it("places navigation in the page header while its accessible panels remain in the bench", async () => {
  function Harness() {
    const [target, setTarget] = useState<HTMLDivElement | null>(null);
    const [surface, setSurface] = useState<WorkbenchSurface>("grilling");
    return (
      <>
        <header aria-label="Task header">
          <div ref={setTarget} />
        </header>
        <TaskWorkbench
          navigationContainer={target}
          value={surface}
          onValueChange={setSurface}
        />
      </>
    );
  }
  render(<Harness />);
  const tabs = screen.getByRole("tablist", { name: "任务工作面" });
  expect(tabs.closest("header")).not.toBeNull();
  await userEvent.click(screen.getByRole("tab", { name: "计划" }));
  const panel = screen.getByRole("tabpanel");
  expect(panel.closest("header")).toBeNull();
  expect(panel.closest('[data-section-id="control-workspace"]')).not.toBeNull();
  expect(screen.getByRole("tab", { name: "计划" })).toHaveAttribute(
    "aria-controls",
    panel.id,
  );
  expect(panel).toHaveTextContent("计划版本尚不可用");
});
