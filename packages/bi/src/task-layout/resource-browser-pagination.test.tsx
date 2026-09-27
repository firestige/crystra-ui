import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ResourceBrowserPagination } from "./resource-browser-pagination";
it("guards page boundaries and delegates page and size changes", () => {
  const page = vi.fn(),
    size = vi.fn();
  const { rerender } = render(
    <ResourceBrowserPagination
      page={1}
      pages={2}
      pageSize={12}
      onPageChange={page}
      onPageSizeChange={size}
    />,
  );
  expect(screen.getByRole("button", { name: "上一页" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "下一页" }));
  expect(page).toHaveBeenCalledWith(2);
  fireEvent.change(screen.getByRole("combobox", { name: "每页条数" }), {
    target: { value: "24" },
  });
  expect(size).toHaveBeenCalledWith(24);
  rerender(
    <ResourceBrowserPagination
      page={2}
      pages={2}
      pageSize={24}
      onPageChange={page}
      onPageSizeChange={size}
    />,
  );
  expect(screen.getByRole("button", { name: "下一页" })).toBeDisabled();
});
