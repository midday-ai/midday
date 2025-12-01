import { obStatusSchema, getJobStatusSchema } from "@api/schemas/jobs";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
// import { getJobStatus } from "@midday/job-client";

export const jobsRouter = createTRPCRouter({
  getStatus: protectedProcedure
    .input(getJobStatusSchema)
    .query(async ({ input }): Promise<JobStatus> => {
      //   const status = await getJobStatus(input.jobId);

      //   if (!status) {
      //     throw new Error(`Job with ID ${input.jobId} not found`);
      //   }

      //   return status;

      // Temporary placeholder until job-client is integrated
      throw new Error("Job status not implemented yet");
    }),
});
