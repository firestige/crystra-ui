import { expect, it } from "vitest";
import { wrapResourceLabel } from "./resource-label-wrap";
const width = (text: string) => Array.from(text).length;
it("wraps at word boundaries without splitting Green or Targeted", () => {
  for (const title of [
    "Evolve Prototype to Green",
    "Implementation-side Targeted Verification",
  ]) {
    const lines = wrapResourceLabel(title, 20, width);
    for (const word of title.split(/\s+/))
      expect(lines.some((line) => line.includes(word))).toBe(true);
  }
});
it("keeps an unbreakable identifier intact and respects explicit newlines", () => {
  expect(wrapResourceLabel("averylongidentifier\nnext", 5, width)).toEqual([
    "averylongidentifier",
    "next",
  ]);
});
it("keeps Chinese punctuation with the preceding word", () => {
  const lines = wrapResourceLabel("检查材料，完成设计。", 4, width);
  expect(lines.join("")).toBe("检查材料，完成设计。");
  expect(lines.every((line) => !/^[，。]/u.test(line))).toBe(true);
});
