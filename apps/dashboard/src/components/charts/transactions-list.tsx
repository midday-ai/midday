import { formatAmount } from "@/utils/format";
import { getTransactions } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { cn } from "@midday/ui/utils";

export async function TransactionsList() {
  const supabase = createClient();

  const { data } = await getTransactions(supabase, {
    to: 5,
    from: 0,
  });

  return (
    <div>
      <ul className="bullet-none divide-y">
        <li className="flex justify-between p-3">
          <span className="font-medium text-sm">Description</span>
          <span className="font-medium text-sm w-[40%]">Amount</span>
        </li>
        {data.map((transaction) => (
          <li key={transaction.id} className="flex justify-between p-3">
            <span
              className={cn(
                "text-sm",
                transaction?.amount > 0 && "text-[#00C969]",
              )}
            >
              {transaction.name}
            </span>
            <span
              className={cn(
                "w-[40%] text-sm",
                transaction?.amount > 0 && "text-[#00C969]",
              )}
            >
              {formatAmount({
                locale: "en",
                amount: transaction.amount,
                currency: transaction.bank_account.currency,
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
