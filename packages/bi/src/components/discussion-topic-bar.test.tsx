import { render, screen, fireEvent } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { DiscussionTopicBar } from "./discussion-topic-bar";
it("selects existing topics and creates new intent without a global Session list", () => {
  const select = vi.fn(),
    create = vi.fn();
  render(
    <DiscussionTopicBar
      group={{ id: "v1", title: "Plan v1" }}
      groups={[{ id: "v1", title: "Plan v1" }]}
      topics={[
        { id: "a", title: "初步计划" },
        { id: "b", title: "通知体验" },
      ]}
      selectedId="a"
      onSelect={select}
      onSelectGroup={vi.fn()}
      onNew={create}
      onRename={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "初步计划" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "通知体验" }));
  expect(select).toHaveBeenCalledWith("b");
  fireEvent.click(screen.getByRole("button", { name: "初步计划" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "新主题" }));
  expect(create).toHaveBeenCalledOnce();
});
