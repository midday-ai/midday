import { App } from "@/hono/app";
import { registerAccountsApi } from "./accounts";
import { registerApiKeysApi } from "./apiKeys";
import { registerAuthApi } from "./auth";
import { registerHealthApi } from "./health";
import { registerInstitutionsApi } from "./institutions";
import { registerRatesApi } from "./rates";
import { registerStatementPdfApi } from "./statements/v1_get_statement_pdf";
import { registerTransactionsApi } from "./transactions";
import { registerUserRoutes } from "./users";

export function setupRoutes(app: App) {
  // register the accounts api route
  registerAccountsApi(app);
  registerHealthApi(app);
  registerApiKeysApi(app);
  registerAuthApi(app);
  registerInstitutionsApi(app);
  registerRatesApi(app);
  registerStatementPdfApi(app);
  registerTransactionsApi(app);
  registerUserRoutes(app);
}
