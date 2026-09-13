import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import {
  SearchField,
  SelectField,
  SelectionControl,
  Popover,
  FullBenchViewer,
  EmptyState,
  ProgressNotice,
} from "./state-components";
it("labels native search, select and selection controls and reports user changes", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(
    <>
      <SearchField label="搜索资源" onChange={change} />
      <SelectField
        label="排序"
        defaultValue="recent"
        options={[
          { value: "recent", label: "最近更新" },
          { value: "name", label: "名称" },
        ]}
      />
      <SelectionControl label="选择资源" type="checkbox" />
    </>,
  );
  await user.type(screen.getByRole("searchbox"), "任务");
  expect(change).toHaveBeenCalled();
  await user.selectOptions(screen.getByRole("combobox"), "name");
  expect(screen.getByRole("combobox")).toHaveValue("name");
  await user.click(screen.getByLabelText("选择资源"));
  expect(screen.getByLabelText("选择资源")).toBeChecked();
});
it("keeps popover form interactive and restores focus on Escape", async () => {
  const user = userEvent.setup();
  render(
    <Popover label="筛选">
      <SelectionControl label="仅看运行中" type="checkbox" />
    </Popover>,
  );
  const trigger = screen.getByRole("button", { name: "筛选" });
  await user.click(trigger);
  await user.click(screen.getByLabelText("仅看运行中"));
  expect(screen.getByLabelText("仅看运行中")).toBeChecked();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});
it("expands within the bench and returns without losing preview state", async () => {
  function Example() {
    const [open, setOpen] = useState(false);
    return (
      <FullBenchViewer
        title="证据列表"
        expanded={open}
        onExpandedChange={setOpen}
        preview={<input aria-label="筛选词" defaultValue="保留" />}
      >
        <p>全部条目</p>
      </FullBenchViewer>
    );
  }
  const user = userEvent.setup();
  render(<Example />);
  await user.click(screen.getByRole("button", { name: "展开证据列表" }));
  expect(screen.getByText("全部条目")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "返回证据列表" }));
  expect(screen.getByLabelText("筛选词")).toHaveValue("保留");
  expect(screen.getByRole("button", { name: "展开证据列表" })).toHaveFocus();
});
it("does not describe empty local data as loading and clamps real progress", () => {
  render(
    <>
      <EmptyState label="没有待裁决内容" />
      <ProgressNotice label="导出资产" value={120} onDismiss={vi.fn()} />
    </>,
  );
  expect(screen.getByText("没有待裁决内容")).toBeVisible();
  expect(screen.queryByText(/加载中/)).not.toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
});
it("surface search keeps one accessible input with optional prefix", async () => {
  const user = userEvent.setup();
  render(<SearchField label="搜索调用" appearance="surface" hideLabel leading={<span>搜索</span>} />);
  const input = screen.getByRole("searchbox", { name: "搜索调用" });
  expect(input.closest('.wsr-search-surface')).not.toBeNull();
  await user.type(input, "delivery");
  expect(input).toHaveValue("delivery");
});
it('allows pages to request a top anchored select without changing other selects',()=>{
 render(<><SelectField label="上方菜单" menuPlacement="top" options={[{value:'a',label:'A'}]}/><SelectField label="默认菜单" options={[{value:'b',label:'B'}]}/></>);
 expect(screen.getByLabelText('上方菜单')).toHaveAttribute('data-menu-placement','top');expect(screen.getByLabelText('默认菜单')).toHaveAttribute('data-menu-placement','bottom');
});
