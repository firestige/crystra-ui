import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import {
  WorkflowCrystallizationView,
  type CrystallizationProjection,
} from "./workflow-crystallization-view";
const ir = { version: "0.2", title: "Exact", nodes: [], edges: [] } as const;
it("keeps forecast and measured evidence separate and never invents the design sample metrics", () => {
  const data: CrystallizationProjection = {
    id: "proposal-1",
    baselineRevision: "r1",
    candidateRevision: "r2",
    title: "Candidate",
    scope: "Exact scope",
    before: { ...ir, nodes: [], edges: [] },
    after: { ...ir, nodes: [], edges: [] },
    layouts: {
      before: {
        ir: { ...ir, nodes: [], edges: [] },
        layout: { width: 200, height: 100, nodes: [], edges: [] },
      },
      after: {
        ir: { ...ir, nodes: [], edges: [] },
        layout: { width: 200, height: 100, nodes: [], edges: [] },
      },
    },
    details: {},
    forecast: {
      costChange: "预计降低 10%",
      latencyChange: "尚无预测",
      summary: "Pending measurement",
      assumptions: ["Known assumption"],
    },
    validation: [],
    notice: "Conditional draft",
  };
  render(<WorkflowCrystallizationView data={data} />);
  expect(screen.queryByText("38%")).not.toBeInTheDocument();
  expect(screen.queryByText(/120 个 Delivery/)).not.toBeInTheDocument();
  expect(screen.getByText("预计降低 10%")).toBeInTheDocument();
  const measured = screen.getByRole("region", { name: "实测对比" });
  expect(within(measured).queryByText("预计降低 10%")).not.toBeInTheDocument();
  expect(screen.getByText("候选版本尚无运行数据")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "应用到草稿" })).toBeDisabled();
});
