import { BankConnections } from "./bank-connections";
import { ManualAccounts } from "./manual-accounts";

export function BankAccountList() {
  return (
    <>
      <BankConnections />
      {/* <ManualAccounts data={manualAccounts} /> */}
    </>
  );
}
