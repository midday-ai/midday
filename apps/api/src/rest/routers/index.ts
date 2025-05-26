import { OpenAPIHono } from "@hono/zod-openapi";
import { Hono } from "hono";
import { protectedMiddleware } from "../middleware";
import { bankAccountsRouter } from "./bank-accounts";
import { bankConnectionsRouter } from "./bank-connections";
import { customersRouter } from "./customers";
import { documentsRouter } from "./documents";
import { inboxRouter } from "./inbox";
import { invoicesRouter } from "./invoices";
import { metricsRouter } from "./metrics";
import { searchRouter } from "./search";
import { tagsRouter } from "./tags";
import { teamsRouter } from "./teams";
import { trackerRouter } from "./tracker";
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
// routers.route("/documents", documentsRouter);
// routers.route("/invoices", invoicesRouter);
// routers.route("/search", searchRouter);
// routers.route("/inbox", inboxRouter);
// routers.route("/tracker", trackerRouter);
// routers.route("/metrics", metricsRouter);
// routers.route("/bank-connections", bankConnectionsRouter);

export { routers };
