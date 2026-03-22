import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { transactionTagsRouter } from "../../trpc/routers/transaction-tags";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const TRANSACTION_ID = "f1e2d3c4-b5a6-7890-abcd-ef1234567890";
const TAG_ID = "e2d3c4b5-a6f7-8901-bcde-f12345678901";

const createCaller = createCallerFactory(transactionTagsRouter);

describe("tRPC: transactionTags.create", () => {
  beforeEach(() => {
    mocks.createTransactionTag.mockReset();
    mocks.createTransactionTag.mockImplementation(() =>
      Promise.resolve([
        {
          teamId: "test-team-id",
          transactionId: TRANSACTION_ID,
          tagId: TAG_ID,
        },
      ]),
    );
  });

  test("links tag to transaction", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create({
      transactionId: TRANSACTION_ID,
      tagId: TAG_ID,
    });

    expect(result).toEqual([
      expect.objectContaining({
        transactionId: TRANSACTION_ID,
        tagId: TAG_ID,
      }),
    ]);
    expect(mocks.createTransactionTag).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        transactionId: TRANSACTION_ID,
        tagId: TAG_ID,
      }),
    );
  });

  test("rejects when tagId is missing", async () => {
    const caller = createCaller(createTestContext());

    await expect(
      caller.create({
        transactionId: TRANSACTION_ID,
      } as { transactionId: string; tagId: string }),
    ).rejects.toThrow();
  });
});

describe("tRPC: transactionTags.delete", () => {
  beforeEach(() => {
    mocks.deleteTransactionTag.mockReset();
    mocks.deleteTransactionTag.mockImplementation(() => Promise.resolve({}));
  });

  test("removes tag link from transaction", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({
      transactionId: TRANSACTION_ID,
      tagId: TAG_ID,
    });

    expect(result).toMatchObject({});
    expect(mocks.deleteTransactionTag).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        transactionId: TRANSACTION_ID,
        tagId: TAG_ID,
        teamId: "test-team-id",
      }),
    );
  });

  test("rejects when transactionId is missing", async () => {
    const caller = createCaller(createTestContext());

    await expect(
      caller.delete({
        tagId: TAG_ID,
      } as { transactionId: string; tagId: string }),
    ).rejects.toThrow();
  });
});
