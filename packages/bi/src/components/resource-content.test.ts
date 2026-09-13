import { describe, expect, it } from "vitest";
import { saveResourceContent } from "./resource-content";
describe("resource content save", () => {
  it("replaces the saved file without mutating an existing render snapshot", () => {
    const original = { path: "skill.md", content: "before" };
    const workspace = { files: [original] };
    saveResourceContent(workspace, "skill.md", "before", "after");
    expect(original.content).toBe("before");
    expect(workspace.files[0].content).toBe("after");
  });
  it("rejects stale drafts without replacing newer content", () => {
    const workspace = {
      files: [{ path: "skill.md", content: "external update" }],
    };
    expect(() =>
      saveResourceContent(workspace, "skill.md", "before", "after"),
    ).toThrow();
    expect(workspace.files[0].content).toBe("external update");
  });
});
