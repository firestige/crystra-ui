import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { List, ListItem, Menu, Tabs } from "./collection-components";
import { IconButton } from "./design-system";

describe("collection components", () => {
  it("keeps row activation separate from trailing actions and uses native links", async () => {
    const open = vi.fn();
    const more = vi.fn();
    const user = userEvent.setup();
    render(
      <List aria-label="任务">
        <ListItem
          primary="发布方案"
          description="运行中"
          onActivate={open}
          actions={
            <IconButton aria-label="更多" onClick={more}>
              …
            </IconButton>
          }
        />
        <ListItem primary="工作流" href="#workflow" />
      </List>,
    );
    await user.click(screen.getByRole("button", { name: "更多" }));
    expect(more).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /发布方案/ }));
    expect(open).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "工作流" })).toHaveAttribute(
      "href",
      "#workflow",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
  it("moves tab focus past disabled items without changing the panel until activation", async () => {
    function Example() {
      const [value, setValue] = useState("plan");
      return (
        <Tabs
          aria-label="工作台"
          value={value}
          onValueChange={setValue}
          items={[
            { value: "plan", label: "计划", panel: "计划内容" },
            { value: "run", label: "执行", disabled: true, panel: "执行内容" },
            { value: "gate", label: "审核", panel: "审核内容" },
          ]}
        />
      );
    }
    const user = userEvent.setup();
    render(<Example />);
    const plan = screen.getByRole("tab", { name: "计划" });
    plan.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "审核" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("计划内容");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("审核内容");
    expect(screen.getByRole("tab", { name: "审核" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{Home}");
    expect(plan).toHaveFocus();
  });
  it("opens a menu with keyboard, skips disabled items, closes on selection and restores focus", async () => {
    const pick = vi.fn();
    const user = userEvent.setup();
    render(
      <Menu
        label="任务操作"
        items={[
          { id: "open", label: "打开", onSelect: pick },
          { id: "archive", label: "归档", disabled: true, onSelect: pick },
          { id: "copy", label: "复制名称", onSelect: pick },
        ]}
      />,
    );
    const trigger = screen.getByRole("button", { name: "任务操作" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "打开" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "复制名称" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(pick).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
  it("dismisses outside without stealing focus and preserves native Tab traversal", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Menu
          label="操作"
          items={[{ id: "a", label: "打开", onSelect: vi.fn() }]}
        />
        <button>下一项</button>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "操作" }));
    await user.keyboard("{Tab}");
    expect(screen.getByRole("button", { name: "下一项" })).toHaveFocus();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "操作" }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
