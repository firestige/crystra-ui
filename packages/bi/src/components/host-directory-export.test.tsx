import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { DeliveryDirectory, type DeliverySearchRecord } from "../public";

it("passes the exact host record through selection without preview records", () => {
  const record: DeliverySearchRecord = {
    deliveryId: "delivery-host",
    traceId: "a".repeat(32),
    taskId: "task-host",
    taskName: "Host Task",
    workflowId: "workflow-host",
    workflowName: "Host Workflow",
    workflowVersion: "1.0.0",
    startedAt: "2026-09-14T00:00:00Z",
  };
  const select = vi.fn();
  render(
    <DeliveryDirectory
      records={[record]}
      range={["2026-01-01", "2027-01-01"]}
      selectedId={null}
      searchFields={[
        {
          key: "taskId",
          label: "Task",
          placeholder: "Task ID",
          match: "exact",
        },
      ]}
      onSelectionChange={select}
    />,
  );
  expect(screen.queryByText("发布插件市场方案")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("delivery-host"));
  expect(select).toHaveBeenCalledWith(record);
});

it("renders a truthful empty result when the host has no records", () => {
  render(
    <DeliveryDirectory
      records={[]}
      range={["2026-01-01", "2027-01-01"]}
      selectedId={null}
      searchFields={[]}
      onSelectionChange={() => undefined}
    />,
  );
  expect(screen.getByText(/没有匹配的 Delivery/)).toBeVisible();
});
