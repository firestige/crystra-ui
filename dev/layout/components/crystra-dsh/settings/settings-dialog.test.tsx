import { useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsDialog } from "./settings-dialog";
afterEach(cleanup);
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
it("loads saved sources, reports a rejected save without clearing input and returns focus to the trigger", async () => {
  const call = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      value: {
        revision: "r1",
        directories: [{ path: "/bound", kind: "collection" }],
      },
    })
    .mockResolvedValueOnce({
      ok: false,
      error: { message: "来源设置已被其他窗口修改" },
    });
  const rpc = { call };
  function Host() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>设置</button>
        {open && (
          <SettingsDialog
            rpc={rpc}
            onClose={() => setOpen(false)}
            onSaved={() => {}}
          />
        )}
      </>
    );
  }
  const user = userEvent.setup();
  render(<Host />);
  const trigger = screen.getByRole("button", { name: "设置" });
  await user.click(trigger);
  const field = await screen.findByRole("textbox", { name: "目录路径 1" });
  await user.clear(field);
  await user.type(field, "/changed");
  await user.click(screen.getByRole("button", { name: "保存" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("其他窗口");
  expect(field).toHaveValue("/changed");
  expect(call.mock.calls[1].slice(0, 3)).toEqual([
    "/crystra-workflows",
    "settings/save",
    { revision: "r1", directories: [{ path: "/changed", kind: "collection" }] },
  ]);
  await user.click(screen.getByRole("button", { name: "关闭设置" }));
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("persists motion preference in display settings", async () => {
  localStorage.clear();
  render(
    <SettingsDialog
      rpc={{
        call: vi
          .fn()
          .mockResolvedValue({
            ok: true,
            value: { revision: "r1", directories: [] },
          }),
      }}
      onClose={() => {}}
      onSaved={() => {}}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "显示" }));
  const toggle = screen.getByRole("switch", { name: "执行动效" });
  expect(toggle).toHaveAttribute("aria-checked", "true");
  await userEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-checked", "false");
  expect(localStorage.getItem("crystra.preferences.execution-motion")).toBe(
    "off",
  );
});
