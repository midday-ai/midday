import { TransactionProvider } from "@midday/providers";
import { NextResponse } from "next/server";

export async function GET(req) {
  const provider = new TransactionProvider({ provider: "gocardless" });

  const data = await provider.getTransactions({
    teamId: "dd6a039e-d071-423a-9a4d-9ba71325d890",
    accountId: "c16a6d43-f121-41bc-ab82-1636029470bc",
    dateFrom: "2024-01-01",
    dateTo: "2024-01-31",
  });

  console.log(data);

  return NextResponse.json(data);
}
