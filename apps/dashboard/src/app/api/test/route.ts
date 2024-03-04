import { TransactionProvider } from "@midday/providers";
import { NextResponse } from "next/server";

export async function GET(req) {
  const provider = new TransactionProvider({ provider: "teller" });

  // const data = await provider.getTransactions({
  //   teamId: "dd6a039e-d071-423a-9a4d-9ba71325d890",
  //   accountId: "c16a6d43-f121-41bc-ab82-1636029470bc",
  //   // dateFrom: "2024-01-01",
  //   // dateTo: "2024-01-31",
  // });

  // const data = await provider.getAccounts({
  //   id: "b3b06174-e7a0-4cd4-ae64-8d966d58a305",
  //   countryCode: "SE",
  //   userId: "123",
  //   teamId: "123",
  //   accountId: "123",
  //   bankConnectionId: "123",
  // });

  const data = await provider.getTransactions({
    teamId: "dd6a039e-d071-423a-9a4d-9ba71325d890",
    accountId: "acc_oiin624kqjrg2mp2ea000",
    accessToken: "test_token_ky6igyqi3qxa4",
    // dateFrom: "2024-01-01",
    // dateTo: "2024-01-31",
  });

  return NextResponse.json(data);
}
