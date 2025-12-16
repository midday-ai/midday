import { getJobStatusSchema } from "@api/schemas/jobs";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { getJobStatus } from "@midday/job-client";
import { TRPCError } from "@trpc/server";

export const jobsRouter = createTRPCRouter({
  getStatus: protectedProcedure
    .input(getJobStatusSchema)
    .query(async ({ input, ctx: { teamId } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Team ID is required",
        });
      }

      try {
        const status = await getJobStatus(input.jobId, { teamId });

        return status;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Job not found or access denied"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Job not found or access denied",
          });
        }
        throw error;
      }
    }),
});
