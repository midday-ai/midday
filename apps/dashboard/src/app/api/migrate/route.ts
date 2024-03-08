import { Provider } from "@midday/providers";
// import { scheduler } from "@midday/jobs/src/transactions/scheduler";
import { createClient } from "@midday/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  const requestUrl = new URL(req.url);
  const teamId = requestUrl.searchParams.get("teamId");
  const supabase = createClient();

  const { data: accountsData, error: accountsError } = await supabase
    .from("bank_accounts")
    .select(
      "id, team_id, account_id, bank_connection:bank_connection_id(provider, access_token, enrollment_id)"
    )
    .eq("team_id", teamId)
    .eq("enabled", true);

  const promises = accountsData?.map(async (account) => {
    const provider = new Provider({
      provider: account.bank_connection.provider,
    });

    return provider.getTransactions({
      teamId: account.team_id,
      accountId: account.account_id,
      accessToken: account.bank_connection?.access_token,
      bankAccountId: account.id,
      latest: true,
    });
  });

  try {
    if (promises) {
      const transactions = (await Promise.all(promises)).flat();

      return NextResponse.json(transactions);
    }
  } catch (error) {
    console.log(error);
  }

  // if (teamId) {
  //   const event = await scheduler.register(teamId, {
  //     type: "interval",
  //     options: {
  //       seconds: 3600, // every 1h
  //     },
  //   });

  //   return NextResponse.json(event);
  // }

  // return NextResponse.json({ error: "No team ID provided" });
}
