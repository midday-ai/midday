import { describe, expect, it } from "bun:test";
import { type AccountType, getType } from "./account";

describe("getType function", () => {
  it("should return 'depository' for 'depository' input", () => {
    expect(getType("depository")).toBe("depository");
  });

  it("should return 'credit' for 'credit' input", () => {
    expect(getType("credit")).toBe("credit");
  });

  it("should return 'other_asset' for any other input", () => {
    expect(getType("loan")).toBe("other_asset");
    expect(getType("investment")).toBe("other_asset");
    expect(getType("unknown")).toBe("other_asset");
  });

  it("should return AccountType", () => {
    const result: AccountType = getType("depository");
    expect(result).toBe("depository");
  });
});
