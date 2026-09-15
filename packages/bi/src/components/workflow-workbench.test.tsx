import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { WorkflowWorkbench } from "./workflow-workbench";
it("keeps host Input and exact workflow context when changing projections", () => {
  const change = vi.fn();
  const props = {
    definitionId: "def-1",
    revision: "sha:abc",
    title: "Import",
    description: "Exact package",
    onPageChange: change,
    input: <textarea aria-label="Host input" />,
    panels: {
      studio: <p>Design</p>,
      resources: <p>Resources</p>,
      crystallization: <p>Candidate</p>,
    },
  };
  const view = render(<WorkflowWorkbench {...props} page="studio" />);
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "unsent" } });
  fireEvent.click(screen.getByRole("tab", { name: "资源配置" }));
  expect(change).toHaveBeenCalledWith("resources");
  view.rerender(<WorkflowWorkbench {...props} page="resources" />);
  expect(screen.getByRole("textbox")).toBe(input);
  expect(input).toHaveValue("unsent");
  expect(screen.getByRole("heading", { name: "Import" })).toBeInTheDocument();
  expect(screen.getByText("sha:abc")).toBeInTheDocument();
  expect(screen.getByRole("tabpanel", { name: "资源配置" })).toHaveTextContent(
    "Resources",
  );
});
