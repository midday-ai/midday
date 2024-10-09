import { App } from "@/hono/app";
import { registerV1ApisDeleteAccountsApi } from "./v1_delete_accounts_api";
import { registerV1ApisGetAccountBalanceApi } from "./v1_get_account_balance_api";
import { registerV1ApisGetAccountsApi } from "./v1_get_accounts_api";

const registerAccountsApi = (app: App): void => {
  registerV1ApisGetAccountsApi(app);
  registerV1ApisDeleteAccountsApi(app);
  registerV1ApisGetAccountBalanceApi(app);
};

export { registerAccountsApi };
