import { expect, test } from "bun:test";
import { getType } from "./account";

test("Get account type", () => {
  expect(getType("depository")).toBe("depository");
  expect(getType("credit")).toBe("credit");
  expect(getType("blah")).toBe("other_asset");
});
