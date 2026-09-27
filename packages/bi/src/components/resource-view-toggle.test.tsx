import { render, screen, fireEvent } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { ResourceViewToggle } from "./resource-view-toggle";
it("uses icon-only controlled Gallery/List choice", () => {
  const change = vi.fn();
  const { container, rerender } = render(
    <ResourceViewToggle value="gallery" onValueChange={change} />,
  );
  expect(container.textContent).toBe("");
  fireEvent.click(screen.getByRole("button", { name: /Gallery.*List/ }));
  expect(change).toHaveBeenCalledWith("list");
  rerender(<ResourceViewToggle value="list" onValueChange={change} />);
  expect(screen.getByRole("button", { name: /List.*Gallery/ })).toBeTruthy();
});
