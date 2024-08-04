import { createClient } from "@midday/supabase/server";
import Link from "next/link";

const currency = "USD";

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
      target_currency: currency,
    }),
    client.from("teams").select("id", { count: "exact", head: true }).limit(1),
    client
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .limit(1),
  ]);

  return (
    <div className="text-center flex flex-col mt-[120px] md:mt-[250px] space-y-4 md:space-y-10">
      <span className="font-medium font-mono text-center text-[40px] md:text-[80px] lg:text-[100px] xl:text-[130px] 2xl:text-[160px] md:mb-2 text-stroke leading-none">
        {Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
          maximumFractionDigits: 2,
        }).format(totalSum ?? 0)}
      </span>
      <span className="text-[#878787]">
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
