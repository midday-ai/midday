import {
  type BalanceAdapter,
  selectPrimaryBalance as selectPrimaryBalanceCore,
} from "../../utils/balance";
import type { GetBalancesResponse } from "./types";

type Balance = GetBalancesResponse["balances"][0];

const balanceAdapter: BalanceAdapter<Balance> = {
  getType: (b) => b.balance_type,
  getAmount: (b) => b.balance_amount.amount,
  getCurrency: (b) => b.balance_amount.currency,
};

const TIERS = [
  ["interimBooked", "ITBD"],
  ["closingBooked", "CLBD"],
  ["interimAvailable", "ITAV"],
  ["expected", "XPCD"],
];

export function selectPrimaryBalance(
  balances: Balance[],
  preferredCurrency?: string,
): Balance | undefined {
  return selectPrimaryBalanceCore(
    balances,
    balanceAdapter,
    TIERS,
    preferredCurrency,
  );
}
