import { getJobStatusSchema } from "@api/schemas/jobs";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { getJobStatus } from "@midday/job-client";

export const jobsRouter = createTRPCRouter({
  getStatus: protectedProcedure
    .input(getJobStatusSchema)
    .query(async ({ input }) => {
      const status = await getJobStatus(input.jobId);

      if (status.status === "unknown") {
        throw new Error(`Job with ID ${input.jobId} not found`);
      }

      return status;
    }),
});
