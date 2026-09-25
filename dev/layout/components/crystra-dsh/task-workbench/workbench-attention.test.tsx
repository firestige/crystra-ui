import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { WorkbenchAttentionBadge } from "./workbench-attention";
import { createWorkbenchStore } from "./workbench-store";
afterEach(cleanup);
it("combines changes and unread messages in one badge and falls back to a dot", () => {
  const { rerender } = render(
    <WorkbenchAttentionBadge changed unreadCount={3} />,
  );
  expect(screen.getByLabelText("内容有更新，3 条未读通知")).toHaveTextContent(
    "3",
  );
  expect(screen.getAllByRole("img")).toHaveLength(1);
  rerender(<WorkbenchAttentionBadge changed unreadCount={0} />);
  expect(screen.getByLabelText("内容有更新")).toHaveAttribute(
    "data-dot",
    "true",
  );
  rerender(<WorkbenchAttentionBadge changed={false} unreadCount={0} />);
  expect(screen.queryByRole("img")).toBeNull();
});
it("does not acknowledge on navigation and preserves updates arriving after the displayed snapshot", () => {
  const store = createWorkbenchStore().create();
  store.actions.receiveAttention("a", "plan", {
    revision: "r1",
    messageIds: ["m1", "m1"],
  });
  store.actions.select("a", "plan");
  expect(store.getSnapshot().attention["task:a"].plan?.readMessageIds).toEqual(
    [],
  );
  store.actions.receiveAttention("a", "plan", {
    revision: "r2",
    messageIds: ["m1", "m2"],
  });
  store.actions.markViewed("a", "plan", { revision: "r1", messageIds: ["m1"] });
  const state = store.getSnapshot().attention["task:a"].plan!;
  expect(state.revision).toBe("r2");
  expect(state.seenRevision).toBe("r1");
  expect(
    state.messageIds.filter((id) => !state.readMessageIds.includes(id)),
  ).toEqual(["m2"]);
  expect(store.getSnapshot().attention["task:b"]).toBeUndefined();
});
