import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ActionMenu } from "./action-menu";
it("ignores unrelated input scrolling but dismisses when its anchor container scrolls", () => {
  const parent = document.createElement("div");
  const trigger = document.createElement("button");
  const search = document.createElement("input");
  parent.append(trigger);
  document.body.append(parent, search);
  const close = vi.fn();
  const view = render(<ActionMenu trigger={trigger} label="Actions" items={[{label:"Rename",onChoose:vi.fn()}]} onClose={close} />);
  fireEvent.scroll(search);
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByRole("menu")).toBeVisible();
  fireEvent.scroll(parent);
  expect(close).toHaveBeenCalledOnce();
  view.unmount();parent.remove();search.remove();
});
