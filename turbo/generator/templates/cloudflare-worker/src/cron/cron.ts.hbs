import { z } from "zod";
import { CronJob } from "./job";

// Define the environment variables we expect
const EnvSchema = z.object({
  CLOUDFLARE_API_TOKEN: z.string(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

type Env = z.infer<typeof EnvSchema>;

// Define the cron jobs
const cronJobs: Record<string, CronJob> = {
  "0 0 * * *": {
    name: "Daily Job",
    description: "Runs daily at midnight",
    handler: async () => {
      console.log("Running daily job");
      // Add your daily job logic here
    },
    requiresCloudflareAPI: false,
  },
  "0 * * * *": {
    name: "Hourly Job",
    description: "Runs every hour",
    requiresCloudflareAPI: false,
    handler: async () => {
      console.log("Running hourly job");
      // Add your hourly job logic here
    },
  },
  "*/15 * * * *": {
    name: "15-Minute Job",
    description: "Runs every 15 minutes",
    requiresCloudflareAPI: false,
    handler: async () => {
      console.log("Running 15-minute job");
      // Add your 15-minute job logic here
    },
  },
  "0 0 1 * *": {
    name: "Monthly Job",
    description: "Runs on the 1st day of each month",
    requiresCloudflareAPI: false,
    handler: async () => {
      console.log("Running monthly job");
      // Add your monthly job logic here
    },
  },
};

export { cronJobs };
