import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { scheduler } from "./scheduler";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

/**
 * Interval in seconds for the scheduler (12 hours)
 */
const SCHEDULER_INTERVAL_SECONDS = 12 * 60 * 60;

/**
 * Zod schema for payload validation
 */
const PayloadSchema = z.object({
  teamId: z.string().min(1),
});

/**
 * Type for the payload
 */
type Payload = z.infer<typeof PayloadSchema>;

/**
 * Interface for the job result
 */
interface JobResult {
  success: boolean;
  message: string;
}

/**
 * Defines a job for manually scheduling transaction sync
 *
 * This job allows users to set up a recurring transaction synchronization
 * for a specific team. It uses the scheduler functionality to create
 * a recurring job that will sync transactions every 12 hours.
 *
 * @remarks
 * This job uses the Trigger.dev framework for job definition and execution.
 * It integrates with the scheduler to set up recurring tasks.
 *
 * @example
 * To trigger this job, you can use the following code:
 *
 * ```typescript
 * import { client } from "@/path/to/trigger-client";
 * import { Events } from "@/path/to/constants";
 *
 * const triggerManualSchedule = async () => {
 *   const event = await client.sendEvent({
 *     name: Events.MANUALLY_SCHEDULE_TRANSACTION_SYNC,
 *     payload: {
 *       teamId: "team_123456",
 *     },
 *   });
 *
 *   console.log("Manual schedule job triggered:", event);
 * };
 *
 * triggerManualSchedule();
 * ```
 */
client.defineJob({
  id: Jobs.MANUALLY_SCHEDULE_TRANSACTION_SYNC,
  name: "Transactions - Manually Schedule Sync",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.MANUALLY_SCHEDULE_TRANSACTION_SYNC,
    schema: PayloadSchema,
  }),
  integrations: { supabase },
  run: async (payload: Payload, io): Promise<JobResult> => {
    try {
      const { teamId } = payload;

      await io.logger.info(
        `Starting manual transaction sync schedule for team: ${teamId}`,
      );

      // Register a new scheduler
      await scheduler.register(teamId, {
        type: "interval",
        options: {
          seconds: SCHEDULER_INTERVAL_SECONDS,
        },
      });

      await io.logger.info(
        `Successfully registered new scheduler for team: ${teamId}`,
      );

      return {
        success: true,
        message: `Successfully scheduled transaction sync for team: ${teamId}`,
      };
    } catch (error) {
      await io.logger.error(
        `Error in manual transaction sync schedule job: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        success: false,
        message: `Error scheduling transaction sync: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

/**
 * Helper function to trigger the manual transaction sync schedule job.
 *
 * @param payload - The payload for the manual schedule job.
 * @returns A promise that resolves with the event details.
 *
 * @example
 * ```typescript
 * import { triggerManualSchedule } from "@/path/to/this/file";
 *
 * const scheduleSync = async () => {
 *   const result = await triggerManualSchedule({
 *     teamId: "team_123456",
 *   });
 *
 *   console.log("Manual schedule triggered:", result);
 * };
 * ```
 */
export async function triggerManualSchedule(payload: Payload) {
  return client.sendEvent({
    name: Events.MANUALLY_SCHEDULE_TRANSACTION_SYNC,
    payload,
  });
}
