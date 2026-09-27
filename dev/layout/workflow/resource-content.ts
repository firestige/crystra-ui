/** Preview workspace writes replace records so a rendered snapshot stays immutable. */
export function saveResourceContent<
  T extends { path: string; content: string },
>(workspace: { files: T[] }, path: string, base: string, content: string) {
  const file = workspace.files.find((candidate) => candidate.path === path);
  if (!file || file.content !== base)
    throw new Error("资源内容已变化，请重新加载");
  workspace.files = workspace.files.map((candidate) =>
    candidate.path === path ? { ...candidate, content } : candidate,
  );
}
