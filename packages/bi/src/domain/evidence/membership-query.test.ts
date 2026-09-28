import { expect, it, vi } from "vitest";
import { createTaskMembershipQuery } from "./membership-query";
const provenance = {
  accepted_digest: "a".repeat(64),
  profile_version: "2.0.0",
  source: { kind: "EVENT", event_id: "binding-a" },
};
const entry = {
  task_id: "task-a",
  delivery_id: "delivery-a",
  manifest_digest: "b".repeat(64),
  recorded_at: "2026-09-17T00:00:00.000000Z",
  provenance,
};
const page = (items = [entry]) => ({
  contract: { name: "evidence.query", revision: "1.0.0" },
  observation_profile: "2.0.0",
  read_model_revision: "2.0.0",
  snapshot: "snapshot-a",
  items,
  next_cursor: null,
});
const selection = { task_id: "task-a", as_of: "2026-09-28T00:00:00.000000Z" };
it("queries exact membership without losing manifest or provenance", async () => {
  const request = vi.fn(async (...args: unknown[]) => {
    expect(args[0]).toBe("tasks/membership");
    expect(args[1]).toEqual({ ...selection, limit: 200 });
    return page();
  });
  const query = createTaskMembershipQuery({ request }, selection);
  await query.actions.load();
  expect(query.getSnapshot().rows).toEqual([entry]);
  expect(query.getSnapshot().meta?.snapshot).toBe("snapshot-a");
  query.dispose();
});
it.each(["different-task", "after-cutoff", "invalid-digest"])(
  "rejects %s before accepting membership",
  async (kind) => {
    const bad = {
      ...entry,
      ...(kind === "different-task"
        ? { task_id: "task-b" }
        : kind === "after-cutoff"
          ? { recorded_at: "2026-10-01T00:00:00.000000Z" }
          : { manifest_digest: "wrong" }),
    };
    const query = createTaskMembershipQuery(
      { request: async () => page([bad]) },
      selection,
    );
    await query.actions.load();
    expect(query.getSnapshot().rows).toEqual([]);
    expect(query.getSnapshot().error).not.toBeNull();
    query.dispose();
  },
);

it("rejects missing task IDs at runtime", () => {
  expect(() =>
    createTaskMembershipQuery(
      { request: vi.fn() },
      {
        ...selection,
        task_id: undefined as unknown as string,
      },
    ),
  ).toThrow();
});
it("accepts bytewise ordered Unicode Delivery IDs", async () => {
  const items = ["\uE000", "\u{10000}"].map((delivery_id) => ({
    ...entry,
    delivery_id,
  }));
  const query = createTaskMembershipQuery(
    { request: async () => page(items) },
    selection,
  );
  await query.actions.load();
  expect(query.getSnapshot().error).toBeNull();
  expect(query.getSnapshot().rows).toEqual(items);
  query.dispose();
});
