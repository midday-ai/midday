import { Provider } from "@midday/providers";
import { NextResponse } from "next/server";

export async function GET(req) {
  const providers = new Provider({ provider: "gocardless" });

  const data = await providers.getTransactions({
    latest: true,
    accountId: "c16a6d43-f121-41bc-ab82-1636029470bc",
    teamId: "123",
    bankAccountId: "123",
  });

  return NextResponse.json(data);
}
