import { describe, it, expect } from "vitest";
import * as Core from "../public";
describe("host resource relation port", () => {
  it("exposes the existing relation renderer through the package entry", () => {
    expect(Core).toHaveProperty("ResourceRelationGraph");
    expect(typeof Reflect.get(Core, "ResourceRelationGraph")).toBe("function");
  });
});
