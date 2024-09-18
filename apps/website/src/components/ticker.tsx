import type { Database } from "@midday/supabase/types";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

const currency = "USD";

export async function Ticker() {
  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get() {
          return null;
        },
        set() {
          return null;
        },
        remove() {
          return null;
        },
      },
    },
  );

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
    <div className="text-center flex flex-col mt-[120px] md:mt-[280px] mb-[120px] md:mb-[250px] space-y-4 md:space-y-10">
      <span className="font-medium font-mono text-center text-[40px] md:text-[80px] lg:text-[100px] xl:text-[130px] 2xl:text-[160px] md:mb-2 text-stroke leading-none">
        {Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
          maximumFractionDigits: 0,
        }).format(totalSum ?? 0)}
      </span>
      <span className="text-[#878787]">
        Through our system{" "}
        <Link href="/open-startup" className="underline">
          {Intl.NumberFormat("en-US", {
            maximumFractionDigits: 0,
          }).format(transactionCount ?? 0)}
        </Link>{" "}
        transactions across{" "}
        <Link href="/open-startup" className="underline">
          {Intl.NumberFormat("en-US", {
            maximumFractionDigits: 0,
          }).format(businessCount ?? 0)}
        </Link>{" "}
        businesses.
      </span>
    </div>
  );
}
