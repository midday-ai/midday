import { createTRPCRouter } from "./init";
import { jobsRouter } from "./routers/jobs";
import { queuesRouter } from "./routers/queues";

export const appRouter = createTRPCRouter({
  queues: queuesRouter,
  jobs: jobsRouter,
});

export type AppRouter = typeof appRouter;

