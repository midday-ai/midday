import type { AppContext } from "@api/ai/context";

export function checkBankAccountsRequired(appContext: AppContext): {
  hasBankAccounts: boolean;
  shouldYield: boolean;
} {
  const hasBankAccounts = appContext.hasBankAccounts ?? false;
  return {
    hasBankAccounts,
    shouldYield: !hasBankAccounts,
  };
}
