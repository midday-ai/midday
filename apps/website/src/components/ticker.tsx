import { createClient } from "@midday/supabase/server";
import Link from "next/link";

export async function Ticker() {
  const client = createClient({
    admin: true,
  });

  const { data } = await client.rpc(
    "calculate_total_sum",
    {
      target_currency: "USD",
    },
    {
      get: true,
    },
  );

  console.log(data);

  return (
    <div className="text-center flex flex-col mt-[300px] space-y-10">
      <span className="font-medium text-center text-[100px] md:text-[170px] mb-2 text-stroke leading-none">
        ${data}
      </span>
      <span>
        We proudly help more than{" "}
        <Link href="/open-startup" className="underline">
          5,300 businesses
        </Link>
        , managing over{" "}
        <Link href="/open-startup" className="underline">
          350,000 transactions
        </Link>
        .
      </span>
    </div>
  );
}
