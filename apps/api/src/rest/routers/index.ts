import { OpenAPIHono } from "@hono/zod-openapi";
import { protectedMiddleware } from "../middleware";
import { bankAccountsRouter } from "./bank-accounts";
import { customersRouter } from "./customers";
import { documentsRouter } from "./documents";
import { inboxRouter } from "./inbox";
import { invoicesRouter } from "./invoices";
import { metricsRouter } from "./metrics";
import oauthRouter from "./oauth";
import { searchRouter } from "./search";
import { tagsRouter } from "./tags";
import { teamsRouter } from "./teams";
import { trackerEntriesRouter } from "./tracker-entries";
import { trackerProjectsRouter } from "./tracker-projects";
import { transactionsRouter } from "./transactions";
import { usersRouter } from "./users";

const routers = new OpenAPIHono();

routers.use(...protectedMiddleware);

routers.route("/transactions", transactionsRouter);
routers.route("/teams", teamsRouter);
routers.route("/users", usersRouter);
routers.route("/customers", customersRouter);
routers.route("/bank-accounts", bankAccountsRouter);
routers.route("/tags", tagsRouter);
routers.route("/documents", documentsRouter);
routers.route("/inbox", inboxRouter);
routers.route("/invoices", invoicesRouter);
routers.route("/search", searchRouter);
routers.route("/metrics", metricsRouter);
routers.route("/tracker-projects", trackerProjectsRouter);
routers.route("/tracker-entries", trackerEntriesRouter);
routers.route("/oauth", oauthRouter);

export { routers };
