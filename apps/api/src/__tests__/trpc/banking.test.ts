import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { bankingRouter } from "../../trpc/routers/banking";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(bankingRouter);

function createInternalContext() {
  return {
    ...createTestContext(),
    isInternalRequest: true,
    requestId: "test-request-id",
  };
}

describe("tRPC: banking.rates", () => {
  beforeEach(() => {
    mocks.getRates.mockReset();
    mocks.getRates.mockImplementation(() => Promise.resolve([]));
  });

  test("returns exchange rates when the request is internal", async () => {
    const caller = createCaller(createInternalContext());
    const result = await caller.rates();

    expect(result).toEqual({ data: [] });
    expect(mocks.getRates).toHaveBeenCalled();
  });

  test("rejects when the request is not internal", async () => {
    const caller = createCaller({
      ...createTestContext(),
      isInternalRequest: false,
      requestId: "test-request-id",
    });

    await expect(caller.rates()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(mocks.getRates).not.toHaveBeenCalled();
  });
});
