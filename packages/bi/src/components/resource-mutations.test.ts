import { beforeEach, describe, expect, it } from "vitest";
import { resourceCatalog } from "./resource-catalog";
import {
  applyResourceMutation,
  resourceDependents,
  type ResourceWorkspace,
} from "./resource-mutations";
const fixture = (): ResourceWorkspace => ({
  title: "test",
  root: "workflow/test",
  version: "1",
  files: [
    { path: "roles/a.md", content: "# A", truncated: false, internal: false },
  ],
  nodes: [
    { id: "file:roles/a.md", kind: "file", label: "A", file: "roles/a.md" },
    { id: "activity:a", kind: "activity", label: "使用者" },
  ],
  edges: [{ from: "activity:a", to: "file:roles/a.md", label: "引用" }],
});
beforeEach(() => {
  window.crystraResourceEvents = [];
});
describe("resource mutation guards", () => {
  it("rejects referenced deletion without changing data or emitting a notification", () => {
    const w = fixture(),
      r = resourceCatalog(w.files)[0],
      before = JSON.stringify(w);
    expect(resourceDependents(w, r).refs).toHaveLength(1);
    expect(() =>
      applyResourceMutation(
        w,
        { kind: "delete", group: r.group, resource: r },
        "",
        "",
      ),
    ).toThrow("仍有引用");
    expect(JSON.stringify(w)).toBe(before);
    expect(window.crystraResourceEvents).toHaveLength(0);
  });
  it("renames display name while retaining reference identity and emits one event", () => {
    const w = fixture(),
      r = resourceCatalog(w.files)[0];
    applyResourceMutation(
      w,
      { kind: "rename", group: r.group, resource: r },
      "新角色",
      "",
    );
    expect(resourceCatalog(w.files)[0].name).toBe("新角色");
    expect(w.edges[0].to).toBe("file:roles/a.md");
    expect(window.crystraResourceEvents).toHaveLength(1);
  });
  it("checks unresolved refs before adding and can delete an unreferenced resource", () => {
    const w = fixture();
    expect(() =>
      applyResourceMutation(
        w,
        { kind: "add", group: "参考资料" },
        "新资料",
        "[missing](missing.md)",
      ),
    ).toThrow("无法解析");
    expect(w.files).toHaveLength(1);
    const event = applyResourceMutation(
      w,
      { kind: "add", group: "参考资料" },
      "新资料",
      "# 新资料",
    );
    const r = resourceCatalog(w.files).find((r) => r.path === event.path)!;
    applyResourceMutation(
      w,
      { kind: "delete", group: r.group, resource: r },
      "",
      "",
    );
    expect(w.files).toHaveLength(1);
    expect(window.crystraResourceEvents).toHaveLength(2);
  });
});
