import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Widget } from "./widget";
it("keeps one primary signal in 1x1 and reveals supporting content in larger recipes", () => {
  const { rerender } = render(
    <Widget
      size="1x1"
      title="标题"
      primary="主要内容"
      secondary="补充说明"
      status="状态"
      footer="底部标记"
      actions="操作"
    />,
  );
  expect(screen.getByText("主要内容")).toBeVisible();
  expect(screen.queryByText("补充说明")).not.toBeInTheDocument();
  rerender(
    <Widget size="2x2" title="标题" primary="主要内容" secondary="补充说明" />,
  );
  expect(screen.getByText("补充说明")).toBeVisible();
  expect(screen.queryByText("底部标记")).not.toBeInTheDocument();
});
