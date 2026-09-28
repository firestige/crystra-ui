import { expect, it, vi } from "vitest";
import { createDeliveryDirectoryQuery } from "./directory-query";
const range = {
  recorded_from: "2026-09-01T00:00:00Z",
  recorded_to: "2026-09-28T00:00:00Z",
};
it("loads bounded metadata with a server total and preserves records without trace detail", async () => {
  const request = vi.fn<
    import("./directory-query").DirectoryTransport["request"]
  >(async () => ({
    contract: { name: "evidence.delivery-directory", revision: "1.0.0" },
    snapshot: "s",
    total: 1,
    next_cursor: null,
    items: [
      {
        delivery_id: "d",
        trace_id: null,
        task_id: null,
        task_name: null,
        workflow_id: null,
        workflow_version: null,
        started_at: null,
        recorded_at: "2026-09-20T00:00:00Z",
      },
    ],
  }));
  const q = createDeliveryDirectoryQuery({ request }, range);
  await q.actions.load();
  expect(q.getSnapshot().error).toBeNull();
  expect(q.getSnapshot().meta?.total).toBe(1);
  expect(q.getSnapshot().rows[0]?.deliveryId).toBe("d");
  expect(request.mock.calls[0]?.[0]).toBe("deliveries/list");
  q.dispose();
});
