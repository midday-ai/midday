import { createClient } from "@midday/supabase/server";
import Link from "next/link";

export async function Ticker() {
  const client = createClient({
    admin: true,
  });

  const [
    { data: totalSum },
    { count: businessCount },
    { count: transactionCount },
  ] = await Promise.all([
    client.rpc("calculate_total_sum", {
      target_currency: "USD",
    }),
    client.from("teams").select("id", { count: "exact", head: true }).limit(1),
    client
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .limit(1),
  ]);

  return (
    <div className="text-center flex flex-col mt-[120px] md:mt-[250px] space-y-4 md:space-y-10">
      <span className="font-medium text-center text-[55px] md:text-[110px] lg:text-[140px] xl:text-[160px] 2xl:text-[180px] md:mb-2 text-stroke leading-none">
        ${totalSum}
      </span>
      <span>
        Join over{" "}
        <Link href="/open-startup" className="underline">
          {Intl.NumberFormat("en-US", {
            maximumFractionDigits: 0,
          }).format(businessCount ?? 0)}
        </Link>{" "}
        businesses that rely on us to gain valuable insights from{" "}
        <Link href="/open-startup" className="underline">
          {Intl.NumberFormat("en-US", {
            maximumFractionDigits: 0,
          }).format(transactionCount ?? 0)}
        </Link>{" "}
        transactions.
      </span>
    </div>
  );
}
