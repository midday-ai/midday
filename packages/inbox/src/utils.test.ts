import { expect, test } from "bun:test";
import { getInboxIdFromEmail } from ".";

test("Get inbox id from email", () => {
  expect(getInboxIdFromEmail("egr34f@inbox.midday.ai")).toMatch("egr34f");
});
