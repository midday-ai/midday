import { expect, test } from "bun:test";
import {
  AccountType,
  formatAmountForAsset,
  getClassification,
  getType,
} from "./account";

test("Get account type", () => {
  expect(getType("depository")).toBe("depository");
  expect(getType("credit")).toBe("credit");
  expect(getType("blah")).toBe("other_asset");
});

test("Get classification", () => {
  expect(getClassification(AccountType.CREDIT)).toBe("liability");
  expect(getClassification(AccountType.LOAN)).toBe("liability");
  expect(getClassification(AccountType.OTHER_LIABILITY)).toBe("liability");
  expect(getClassification(AccountType.OTHER_ASSET)).toBe("asset");
});

test("Format amount", () => {
  expect(
    formatAmountForAsset({
      amount: 1000,
      type: AccountType.CREDIT,
    })
  ).toBe(1000);

  expect(
    formatAmountForAsset({
      amount: 1000,
      type: AccountType.DEPOSITORY,
    })
  ).toBe(-1000);
});
