import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { jobsRouter } from "../../trpc/routers/jobs";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(jobsRouter);

describe("tRPC: jobs.getStatus", () => {
  beforeEach(() => {
    mocks.getJobStatus.mockReset();
    mocks.getJobStatus.mockImplementation(() =>
      Promise.resolve({ status: "completed" as const }),
    );
  });

  test("returns job status", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getStatus({ jobId: "job-123" });

    expect(result).toEqual({ status: "completed" });
    expect(mocks.getJobStatus).toHaveBeenCalledWith("job-123", {
      teamId: "test-team-id",
    });
  });

  test("maps access denied to FORBIDDEN", async () => {
    mocks.getJobStatus.mockImplementation(() =>
      Promise.reject(new Error("Job not found or access denied")),
    );

    const caller = createCaller(createTestContext());
    await expect(caller.getStatus({ jobId: "job-123" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Job not found or access denied",
    });
  });
});
