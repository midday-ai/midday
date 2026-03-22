import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { transactionAttachmentsRouter } from "../../trpc/routers/transaction-attachments";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const ATTACHMENT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const createCaller = createCallerFactory(transactionAttachmentsRouter);

describe("tRPC: transactionAttachments.delete", () => {
  beforeEach(() => {
    mocks.deleteAttachment.mockReset();
    mocks.deleteAttachment.mockImplementation(() =>
      Promise.resolve({ id: ATTACHMENT_ID }),
    );
  });

  test("deletes attachment by id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: ATTACHMENT_ID });

    expect(result).toMatchObject({ id: ATTACHMENT_ID });
    expect(mocks.deleteAttachment).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: ATTACHMENT_ID,
        teamId: "test-team-id",
      }),
    );
  });

  test("rejects when id is missing", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.delete({} as { id: string })).rejects.toThrow();
  });
});

const TX_ID = "f1e2d3c4-b5a6-7890-abcd-ef1234567890";

describe("tRPC: transactionAttachments.createMany", () => {
  beforeEach(() => {
    mocks.createAttachments.mockReset();
    mocks.createAttachments.mockImplementation(() =>
      Promise.resolve([{ id: "att-new-1" }]),
    );
  });

  test("creates attachments from array input", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.createMany([
      {
        type: "image/png",
        size: 1024,
        path: ["test-team-id", "file.png"],
        name: "file.png",
        transactionId: TX_ID,
      },
    ]);

    expect(result).toEqual([expect.objectContaining({ id: "att-new-1" })]);
    expect(mocks.createAttachments).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        userId: "test-user-id",
        attachments: [
          expect.objectContaining({
            transactionId: TX_ID,
            name: "file.png",
          }),
        ],
      }),
    );
  });
});
