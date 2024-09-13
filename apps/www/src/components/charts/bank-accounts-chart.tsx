import { fetchStats } from "@/actions/fetch-stats";

export async function BankAccountsChart() {
  const { bankAccounts } = await fetchStats();

  return (
    <div className="flex flex-col items-center justify-center space-y-4 border border-border bg-background px-6 pb-6 pt-8">
      <h2 className="text-2xl">Bank Accounts</h2>
      <p className="text-center text-sm text-[#878787]">
        Number of connected bank accounts.
      </p>

      <div className="flex items-center space-x-4">
        <span className="relative ml-auto flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>

        <span className="mt-auto font-mono text-[80px] md:text-[122px]">
          {bankAccounts &&
            Intl.NumberFormat("en", { notation: "compact" }).format(
              bankAccounts,
            )}
        </span>
      </div>
    </div>
  );
}
