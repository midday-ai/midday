import { expect, test } from "bun:test";
import { getInboxEmail, getInboxIdFromEmail } from ".";

test("Get inbox id from email", () => {
  expect(getInboxIdFromEmail("egr34f@inbox.midday.ai")).toMatch("egr34f");
});

test("Get inbox email by id", () => {
  expect(getInboxEmail("egr34f")).toMatch("egr34f@inbox.staging.midday.ai");
});
