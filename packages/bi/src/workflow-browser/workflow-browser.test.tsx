import { render, screen, fireEvent } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { WorkflowBrowserSurface } from "./workflow-browser";
it("uses real workflow identity, filters semantic status and opens shared item actions", () => {
  const items = [
    {
      definitionId: "a",
      title: "Alpha",
      version: "1",
      revision: "r1",
      packageStatus: "CONFIRMED",
      packageName: "pkg-a",
      directory: "/a",
    },
    {
      definitionId: "b",
      title: "Beta",
      version: "2",
      revision: "r2",
      packageStatus: "DRAFT",
      packageName: "pkg-b",
      directory: "/b",
    },
  ];
  const open = vi.fn();
  const { container } = render(
    <WorkflowBrowserSurface
      items={items}
      workflowHref={(w) =>
        "/workflows/" + w.definitionId + "?revision=" + w.revision
      }
      onOpen={open}
    />,
  );
  expect(container.querySelectorAll(".crystra-resource-card")).toHaveLength(2);
  expect(screen.getByRole("link", { name: /Alpha/ })).toHaveAttribute(
    "href",
    "/workflows/a?revision=r1",
  );
  fireEvent.click(screen.getByRole("button", { name: "工作流操作：Alpha" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "资源配置" }));
  expect(open).toHaveBeenCalledWith(items[0], "resources");
  fireEvent.change(screen.getByRole("searchbox", { name: "搜索工作流" }), {
    target: { value: "Beta" },
  });
  expect(container.querySelectorAll(".crystra-resource-card")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: /Gallery.*List/ }));
  expect(container.querySelectorAll(".crystra-resource-row")).toHaveLength(1);
});
it("tracks the opened menu by identity even when workflow titles match", () => {
  const first = {
    definitionId: "a",
    revision: "r1",
    title: "Same",
    version: "1",
    packageStatus: "DRAFT",
    packageName: "pkg",
    directory: "/a",
  };
  render(
    <WorkflowBrowserSurface
      items={[first, { ...first, definitionId: "b", directory: "/b" }]}
      workflowHref={(w) => `/workflows/${w.definitionId}`}
      onOpen={() => {}}
    />,
  );
  const triggers = screen.getAllByRole("button", { name: "工作流操作：Same" });
  fireEvent.click(triggers[0]);
  expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
  expect(triggers[1]).toHaveAttribute("aria-expanded", "false");
});
