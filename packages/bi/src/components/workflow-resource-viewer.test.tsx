import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { WorkflowResourceViewer } from "./workflow-resource-viewer";
it("consumes an explicit resource catalog without exposing local sample writes or touching host Input", () => {
  const file = {
    path: "opaque/diagram.png",
    content: "",
    truncated: false,
    internal: false,
    imageData:
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  };
  const workspace = {
    title: "same label",
    root: "/isolated/package",
    version: "revision-1",
    files: [file],
    nodes: [],
    edges: [],
  };
  const discuss = vi.fn();
  render(
    <>
      <textarea aria-label="Host draft" defaultValue="keep" />
      <WorkflowResourceViewer
        definitionId="definition-a"
        revision="revision-1"
        workspace={workspace}
        catalog={[
          {
            id: "resource-stable",
            aliases: [],
            name: "Declared diagram",
            purpose: "Declared purpose",
            path: file.path,
            group: "参考资料",
            files: [file],
          },
        ]}
        onDiscuss={discuss}
      />
    </>,
  );
  expect(
    screen.getByRole("heading", { name: "Declared diagram" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "重命名资源" })).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "删除Declared diagram" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "在对话中讨论此文件" }));
  expect(discuss).toHaveBeenCalledWith({
    resourceId: "resource-stable",
    path: "opaque/diagram.png",
  });
  expect(screen.getByRole("textbox", { name: "Host draft" })).toHaveValue(
    "keep",
  );
  fireEvent.click(screen.getByRole("tab", { name: "关联图" }));
  expect(screen.getByRole("status")).toHaveTextContent("关系投影尚未提供");
  expect(workspace.files).toEqual([file]);
});
