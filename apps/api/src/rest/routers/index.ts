import { Hono } from "hono";
import { accountsRouter } from "./accounts/route";
import { customersRouter } from "./customers/route";
import { documentsRouter } from "./documents/route";
import { inboxRouter } from "./inbox/route";
import { invoicesRouter } from "./invoices/route";
import { metricsRouter } from "./metrics/route";
import { searchRouter } from "./search/route";
import { tagsRouter } from "./tags/route";
import { teamRouter } from "./team/route";
import { trackerRouter } from "./tracker/route";
import { transactionsRouter } from "./transactions/route";
import { usersRouter } from "./users/route";

const routers = new Hono();

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
