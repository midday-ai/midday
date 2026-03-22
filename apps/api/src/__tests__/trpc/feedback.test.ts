import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { chatFeedbackRouter } from "../../trpc/routers/feedback";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(chatFeedbackRouter);

describe("tRPC: chatFeedback.create", () => {
  beforeEach(() => {
    mocks.chatFeedbackSet.mockReset();
    mocks.chatFeedbackSet.mockImplementation(() => Promise.resolve());
  });

  test("stores feedback and returns success", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create({
      chatId: "chat-1",
      messageId: "msg-1",
      type: "positive",
    });

    expect(result).toEqual({ success: true });
    expect(mocks.chatFeedbackSet).toHaveBeenCalledWith(
      "chat-1",
      "msg-1",
      "test-user-id",
      expect.objectContaining({
        type: "positive",
        teamId: "test-team-id",
      }),
    );
  });

  test("rejects an invalid feedback type", async () => {
    const caller = createCaller(createTestContext());

    await expect(
      caller.create({
        chatId: "chat-1",
        messageId: "msg-1",
        type: "invalid" as "positive",
      }),
    ).rejects.toThrow();
    expect(mocks.chatFeedbackSet).not.toHaveBeenCalled();
  });
});

describe("tRPC: chatFeedback.delete", () => {
  beforeEach(() => {
    mocks.chatFeedbackDelete.mockReset();
    mocks.chatFeedbackDelete.mockImplementation(() => Promise.resolve());
  });

  test("removes feedback and returns success", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({
      chatId: "chat-1",
      messageId: "msg-1",
    });

    expect(result).toEqual({ success: true });
    expect(mocks.chatFeedbackDelete).toHaveBeenCalledWith(
      "chat-1",
      "msg-1",
      "test-user-id",
    );
  });
});
