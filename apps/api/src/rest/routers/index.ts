import { Hono } from "hono";
import { protectedMiddleware } from "../middleware";
import { accountsRouter } from "./accounts";
import { customersRouter } from "./customers";
import { documentsRouter } from "./documents";
import { inboxRouter } from "./inbox";
import { invoicesRouter } from "./invoices";
import { metricsRouter } from "./metrics";
import { searchRouter } from "./search";
import { tagsRouter } from "./tags";
import { teamRouter } from "./team";
import { trackerRouter } from "./tracker";
import { transactionsRouter } from "./transactions";
import { usersRouter } from "./users";

const routers = new Hono();

routers.use(...protectedMiddleware);

routers.route("/transactions", transactionsRouter);
routers.route("/teams", teamRouter);
routers.route("/users", usersRouter);
routers.route("/invoices", invoicesRouter);
routers.route("/documents", documentsRouter);
routers.route("/search", searchRouter);
routers.route("/inbox", inboxRouter);
routers.route("/tracker", trackerRouter);
routers.route("/customers", customersRouter);
routers.route("/metrics", metricsRouter);
routers.route("/accounts", accountsRouter);
routers.route("/tags", tagsRouter);

export { routers };
