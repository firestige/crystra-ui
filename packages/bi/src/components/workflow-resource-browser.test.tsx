import { useEffect } from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import {
  WorkflowResourceBrowser,
  type WorkflowResourceWorkspace,
} from "./workflow-resource-browser";
Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
  configurable: true,
  value() {
    this.setAttribute("open", "");
  },
});
vi.mock("./resource-source-editor", () => ({
  ResourceSourceEditor: ({
    initialText,
    onMount,
    onChange,
    readOnly,
  }: {
    initialText: string;
    onMount: (text: string) => void;
    onChange: (text: string) => void;
    readOnly: boolean;
  }) => {
    useEffect(() => {
      onMount(initialText);
    }, []);
    return (
      <textarea
        aria-label="test source"
        defaultValue={initialText}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  },
}));
it("keeps the edited draft when the asynchronous owner write rejects", async () => {
  const workspace: WorkflowResourceWorkspace = {
    title: "test",
    root: "/test",
    version: "1",
    files: [
      {
        path: "roles/reviewer.md",
        content: "# Reviewer",
        internal: false,
        truncated: false,
      },
    ],
    nodes: [],
    edges: [],
  };
  let reject!: (error: Error) => void;
  const save = vi.fn(
    () =>
      new Promise<void>((_, fail) => {
        reject = fail;
      }),
  );
  render(
    <WorkflowResourceBrowser
      workspace={workspace}
      onQuote={vi.fn()}
      onSave={save}
      onMutation={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "开启编辑" }));
  const editor = screen.getByRole("textbox", { name: "test source" });
  fireEvent.change(editor, { target: { value: "# Changed" } });
  fireEvent.click(screen.getByRole("button", { name: "保存" }));
  expect(save).toHaveBeenCalledWith(
    "roles/reviewer.md",
    "# Reviewer",
    "# Changed",
  );
  expect(editor).toHaveAttribute("readonly");
  reject(new Error("conflict"));
  await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());
  expect(editor).toHaveValue("# Changed");
  expect(workspace.files[0].content).toBe("# Reviewer");
});
it("locks the shared resource dialog during submission and preserves input on rejection", async () => {
  let reject!: (e: Error) => void;
  const mutation = vi.fn(
    () => new Promise<{ path: string }>((_, r) => (reject = r)),
  );
  render(
    <WorkflowResourceBrowser
      workspace={{
        title: "test",
        root: "/test",
        version: "1",
        files: [],
        nodes: [],
        edges: [],
      }}
      onQuote={vi.fn()}
      onSave={vi.fn()}
      onMutation={mutation}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "添加参考资料" }));
  const dialog = screen.getByRole("dialog");
  fireEvent.change(screen.getByRole("textbox", { name: "资源名称" }), {
    target: { value: "Notes" },
  });
  fireEvent.click(screen.getByRole("button", { name: "创建资源" }));
  expect(within(dialog).getByRole("button", { name: "取消" })).toBeDisabled();
  expect(
    fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true })),
  ).toBe(false);
  reject(Error("offline"));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("offline"),
  );
  expect(screen.getByRole("textbox", { name: "资源名称" })).toHaveValue(
    "Notes",
  );
});
