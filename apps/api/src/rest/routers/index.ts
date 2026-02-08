import { OpenAPIHono } from "@hono/zod-openapi";
import { protectedMiddleware } from "../middleware";
import { appsRouter } from "./apps";
import { bankAccountsRouter } from "./bank-accounts";
import { chatRouter } from "./chat";
import { customersRouter } from "./customers";
import { desktopRouter } from "./desktop";
import { documentsRouter } from "./documents";
import { filesRouter } from "./files";
import { inboxRouter } from "./inbox";
import { insightsRouter } from "./insights";
import { invoicePaymentsRouter } from "./invoice-payments";
import { invoicesRouter } from "./invoices";
import { mcpRouter } from "./mcp";
import { notificationsRouter } from "./notifications";
import oauthRouter from "./oauth";
import { reportsRouter } from "./reports";
import { searchRouter } from "./search";
import { tagsRouter } from "./tags";
import { teamsRouter } from "./teams";
import { trackerEntriesRouter } from "./tracker-entries";
import { trackerProjectsRouter } from "./tracker-projects";
import { transactionsRouter } from "./transactions";
import { transcriptionRouter } from "./transcription";
import { usersRouter } from "./users";
import { webhookRouter } from "./webhooks";

const routers = new OpenAPIHono();

// Mount public routes first
routers.route("/oauth", oauthRouter);
routers.route("/webhook", webhookRouter);
routers.route("/files", filesRouter);
routers.route("/apps", appsRouter);
routers.route("/invoice-payments", invoicePaymentsRouter);
routers.route("/desktop", desktopRouter);

// Apply protected middleware to all subsequent routes
routers.use(...protectedMiddleware);

// Mount protected routes
routers.route("/notifications", notificationsRouter);
routers.route("/transactions", transactionsRouter);
routers.route("/teams", teamsRouter);
routers.route("/users", usersRouter);
routers.route("/customers", customersRouter);
routers.route("/bank-accounts", bankAccountsRouter);
routers.route("/tags", tagsRouter);
routers.route("/documents", documentsRouter);
routers.route("/inbox", inboxRouter);
routers.route("/insights", insightsRouter);
routers.route("/invoices", invoicesRouter);
routers.route("/search", searchRouter);
routers.route("/reports", reportsRouter);
routers.route("/tracker-projects", trackerProjectsRouter);
routers.route("/tracker-entries", trackerEntriesRouter);
routers.route("/chat", chatRouter);
routers.route("/transcription", transcriptionRouter);
routers.route("/mcp", mcpRouter);

export { routers };
