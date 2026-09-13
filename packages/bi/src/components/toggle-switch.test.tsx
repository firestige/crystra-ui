import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ToggleSwitch } from "./toggle-switch";

it("keeps a controlled switch in its supplied state until the consumer accepts the change", () => {
  const change = vi.fn();
  const { rerender } = render(
    <ToggleSwitch label="通知" checked={false} onCheckedChange={change} />,
  );
  const control = screen.getByRole("switch", { name: "通知" });
  fireEvent.click(control);
  expect(change).toHaveBeenCalledWith(true);
  expect(control).toHaveAttribute("aria-checked", "false");
  rerender(<ToggleSwitch label="通知" checked onCheckedChange={change} />);
  expect(control).toHaveAttribute("aria-checked", "true");
});

it("alternates named views through one control without treating either view as disabled", () => {
  function Demo() {
    const [checked, setChecked] = useState(false);
    return (
      <ToggleSwitch
        mode="choice"
        label="视图"
        labels={["Gallery", "List"]}
        checked={checked}
        onCheckedChange={setChecked}
      />
    );
  }
  render(<Demo />);
  const control = screen.getByRole("button", {
    name: "视图：Gallery，切换到 List",
  });
  fireEvent.click(control);
  expect(control).toHaveAccessibleName("视图：List，切换到 Gallery");
  expect(control).not.toHaveAttribute("aria-checked");
  fireEvent.click(control);
  expect(control).toHaveAccessibleName("视图：Gallery，切换到 List");
});

it("does not submit a form or change a disabled switch", () => {
  const change = vi.fn(),
    submit = vi.fn();
  render(
    <form onSubmit={submit}>
      <ToggleSwitch
        label="禁用开关"
        checked
        disabled
        onCheckedChange={change}
      />
    </form>,
  );
  const control = screen.getByRole("switch");
  expect(control).toHaveAttribute("type", "button");
  fireEvent.click(control);
  expect(change).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
});
