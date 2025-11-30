import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { serveStatic } from "@hono/node-server/serve-static";
import type { Hono } from "hono";
import { inboxProviderQueue, inboxQueue } from "./queues/inbox";
import { transactionsQueue } from "./queues/transactions";

/**
 * Create Bull Board instance with all queues and mount on Hono app
 */
export function setupBullBoard(app: Hono) {
  // Create HonoAdapter with serveStatic
  const serverAdapter = new HonoAdapter(serveStatic);

  // Set base path before configuring Bull Board
  serverAdapter.setBasePath("/admin/queues");

  // Configure Bull Board with queues
  // createBullBoard automatically sets up static paths, views path, routes, etc.
  createBullBoard({
    queues: [
      new BullMQAdapter(transactionsQueue),
      new BullMQAdapter(inboxQueue),
      new BullMQAdapter(inboxProviderQueue),
    ],
    serverAdapter,
  });

  // Register the plugin and get the router
  // This sets up all the routes and static files
  const bullBoardRouter = serverAdapter.registerPlugin();

  // Mount the Bull Board router on the Hono app
  app.route("/admin/queues", bullBoardRouter as any);
}
