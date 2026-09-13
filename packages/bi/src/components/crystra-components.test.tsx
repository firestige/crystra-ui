import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button, Card, Chip, Divider, IconButton, Typography } from "../public";

describe("Crystra reusable component contracts", () => {
  it("keeps SVG content, refs and activation when composing IconButton from Button", () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <form>
        <IconButton aria-label="复制" ref={ref} onClick={onClick}>
          <svg data-testid="copy-icon" />
        </IconButton>
      </form>,
    );
    const button = screen.getByRole("button", { name: "复制" });
    expect(button).toContainElement(screen.getByTestId("copy-icon"));
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("type", "button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
  it("keeps appearance, semantic tone and size independent without inventing pressed state", () => {
    const onClick = vi.fn();
    render(
      <Button
        appearance="outline"
        tone="warning"
        size="regular"
        disabled
        onClick={onClick}
        startIcon={<svg data-testid="leading" />}
      >
        查看影响
      </Button>,
    );
    const button = screen.getByRole("button", { name: "查看影响" });
    expect(button).toHaveAttribute("data-tone", "warning");
    expect(button).toHaveAttribute("data-size", "regular");
    expect(button).not.toHaveAttribute("aria-pressed");
    expect(button).toContainElement(screen.getByTestId("leading"));
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
  it("composes card content and actions without turning the whole surface into a button", () => {
    const action = vi.fn();
    render(
      <Card
        heading="当前决策状态"
        description="已确认的内容"
        actions={<Button onClick={action}>展开</Button>}
        tone="warning"
        border="dashed"
      >
        <Typography variant="body">决定内容</Typography>
      </Card>,
    );
    expect(screen.getByRole("heading", { name: "当前决策状态" })).toBeVisible();
    fireEvent.click(screen.getByText("决定内容"));
    expect(action).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "展开" }));
    expect(action).toHaveBeenCalledOnce();
  });
  it("separates presentation chips from business status and supports vertical separators", () => {
    render(
      <>
        <Chip tone="success" appearance="outline">
          已确认
        </Chip>
        <Divider orientation="vertical" />
      </>,
    );
    expect(screen.getByText("已确认")).toHaveAttribute("data-tone", "success");
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
  });
});
