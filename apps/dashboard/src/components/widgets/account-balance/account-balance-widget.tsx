import { AccountBalance } from "./account-balance";

export function AccountBalanceWidget() {
  return (
    <div className="h-full">
      <div className="flex justify-between">
        <div>
          <h2 className="text-lg">Account balance</h2>
        </div>
      </div>

      <AccountBalance />
    </div>
  );
}
