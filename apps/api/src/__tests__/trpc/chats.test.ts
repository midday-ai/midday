import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { chatsRouter } from "../../trpc/routers/chats";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(chatsRouter);

describe("tRPC: chats.list", () => {
  beforeEach(() => {
    mocks.memoryGetChats.mockReset();
    mocks.memoryGetChats.mockImplementation(() => Promise.resolve([]));
  });

  test("returns an empty chat list with default input", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.list({});

    expect(result).toEqual([]);
    expect(mocks.memoryGetChats).toHaveBeenCalledWith({
      userId: "test-user-id:test-team-id",
      search: undefined,
      limit: 50,
    });
  });

  test("rejects when limit is below the minimum", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.list({ limit: 0 })).rejects.toThrow();
  });
});

describe("tRPC: chats.delete", () => {
  beforeEach(() => {
    mocks.memoryGetMessages.mockReset();
    mocks.memoryDeleteChat.mockReset();
    mocks.memoryGetMessages.mockImplementation(() => Promise.resolve([]));
    mocks.memoryDeleteChat.mockImplementation(() =>
      Promise.resolve({ success: true }),
    );
  });

  test("deletes a chat the user can access", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({ chatId: "chat-123" });

    expect(result).toEqual({ success: true });
    expect(mocks.memoryGetMessages).toHaveBeenCalledWith({
      chatId: "chat-123",
      userId: "test-user-id:test-team-id",
      limit: 1,
    });
    expect(mocks.memoryDeleteChat).toHaveBeenCalledWith("chat-123");
  });

  test("rejects when the memory provider cannot load the chat", async () => {
    mocks.memoryGetMessages.mockImplementation(() =>
      Promise.reject(new Error("not found")),
    );

    const caller = createCaller(createTestContext());

    await expect(caller.delete({ chatId: "chat-123" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(mocks.memoryDeleteChat).not.toHaveBeenCalled();
  });
});

describe("tRPC: chats.get", () => {
  beforeEach(() => {
    mocks.memoryGetMessages.mockReset();
    mocks.memoryGetMessages.mockImplementation(() => Promise.resolve([]));
  });

  test("returns messages for chat id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.get({ chatId: "chat-123" });

    expect(result).toEqual([]);
    expect(mocks.memoryGetMessages).toHaveBeenCalledWith({
      chatId: "chat-123",
      userId: "test-user-id:test-team-id",
      limit: 50,
    });
  });
});
