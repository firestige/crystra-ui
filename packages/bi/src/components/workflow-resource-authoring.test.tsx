import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { WorkflowResourceViewer } from "./workflow-resource-viewer";
vi.mock("./resource-source-editor", () => ({
  ResourceSourceEditor: ({
    initialText,
    readOnly,
    onChange,
  }: {
    initialText: string;
    readOnly: boolean;
    onChange: (text: string) => void;
  }) => (
    <textarea
      aria-label="资源源码"
      defaultValue={initialText}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
const file = {
  path: "notes.txt",
  content: "original",
  truncated: false,
  internal: false,
};
const workspace = {
  title: "Draft package",
  root: "/isolated",
  version: "r1",
  files: [file],
  nodes: [],
  edges: [],
};
const catalog = [
  {
    id: "resource-a",
    name: "Notes",
    path: file.path,
    purpose: "",
    aliases: [],
    group: "参考资料" as const,
    files: [file],
  },
];
it("awaits isolated draft persistence, prevents duplicate submits, and does not mutate its input snapshot", async () => {
  let complete!: () => void;
  const save = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        complete = resolve;
      }),
  );
  render(
    <WorkflowResourceViewer
      definitionId="save-success"
      revision="def-r1"
      workspace={workspace}
      catalog={catalog}
      onSaveDraft={save}
    />,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "资源源码" }), {
    target: { value: "edited" },
  });
  fireEvent.click(screen.getByRole("button", { name: "保存" }));
  expect(save).toHaveBeenCalledWith({
    resourceId: "resource-a",
    path: "notes.txt",
    baseRevision: "r1",
    baseContent: "original",
    content: "edited",
  });
  expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
  expect(screen.queryByText("草案已保存，未发布。")).not.toBeInTheDocument();
  complete();
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("草案已保存"),
  );
  expect(workspace.files[0].content).toBe("original");
});
it("retains edited text and allows retry when the persistence port rejects", async () => {
  const save = vi.fn().mockRejectedValue(new Error("REVISION_CONFLICT"));
  render(
    <WorkflowResourceViewer
      definitionId="save-failure"
      revision="def-r1"
      workspace={workspace}
      catalog={catalog}
      onSaveDraft={save}
    />,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "资源源码" }), {
    target: { value: "keep my draft" },
  });
  fireEvent.click(screen.getByRole("button", { name: "保存" }));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("REVISION_CONFLICT"),
  );
  expect(screen.getByRole("textbox", { name: "资源源码" })).toHaveValue(
    "keep my draft",
  );
  expect(screen.getByRole("button", { name: "保存" })).toBeEnabled();
});
it("refuses an edited draft after the supplied resource baseline changes", async () => {
  const save = vi.fn();
  const props = {
    definitionId: "baseline-change",
    revision: "def-r1",
    workspace,
    catalog,
    onSaveDraft: save,
  };
  const view = render(<WorkflowResourceViewer {...props} />);
  fireEvent.change(screen.getByRole("textbox", { name: "资源源码" }), {
    target: { value: "keep" },
  });
  view.rerender(
    <WorkflowResourceViewer
      {...props}
      workspace={{
        ...workspace,
        version: "r2",
        files: [{ ...file, content: "remote change" }],
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "保存" }));
  expect(screen.getByRole("alert")).toHaveTextContent("草稿已保留");
  expect(save).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox", { name: "资源源码" })).toHaveValue("keep");
});
it("retains the local edit when write authority is revoked during an outstanding save", async () => {
  let complete!: () => void;
  const save = () =>
    new Promise<void>((resolve) => {
      complete = resolve;
    });
  const props = {
    definitionId: "revocation",
    revision: "def-r1",
    workspace,
    catalog,
  };
  const view = render(<WorkflowResourceViewer {...props} onSaveDraft={save} />);
  fireEvent.change(screen.getByRole("textbox", { name: "资源源码" }), {
    target: { value: "keep" },
  });
  fireEvent.click(screen.getByRole("button", { name: "保存" }));
  view.rerender(<WorkflowResourceViewer {...props} />);
  complete();
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("写入权限已撤销"),
  );
  expect(screen.queryByText("草案已保存，未发布。")).not.toBeInTheDocument();
});
it("retains an unsaved draft across unmounts of the same exact Workflow but isolates another revision", () => {
  const save = vi.fn();
  const props = {
    definitionId: "retention",
    revision: "def-r1",
    workspace,
    catalog,
    onSaveDraft: save,
  };
  const first = render(<WorkflowResourceViewer {...props} />);
  fireEvent.change(screen.getByRole("textbox", { name: "资源源码" }), {
    target: { value: "retained unsaved text" },
  });
  first.unmount();
  const unload = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(unload);
  expect(unload.defaultPrevented).toBe(true);
  const other = render(<WorkflowResourceViewer {...props} revision="def-r2" />);
  expect(screen.getByRole("textbox", { name: "资源源码" })).toHaveValue(
    "original",
  );
  other.unmount();
  render(<WorkflowResourceViewer {...props} />);
  expect(screen.getByRole("textbox", { name: "资源源码" })).toHaveValue(
    "retained unsaved text",
  );
  expect(screen.getByRole("button", { name: "保存" })).toBeEnabled();
});
