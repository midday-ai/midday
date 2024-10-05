import { BankAccount } from "./bank-account";

export function ManualAccounts({ data }) {
  return (
    <div className="px-6 pb-6 space-y-6 divide-y">
      {data.map((account) => (
        <BankAccount
          key={account.id}
          id={account.id}
          name={account.name}
          manual={account.manual}
          currency={account.currency}
          type={account.type}
          enabled
          balance={account.balance}
        />
      ))}
    </div>
  );
}
