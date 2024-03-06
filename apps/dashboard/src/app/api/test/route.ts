import { Provider } from "@midday/providers";
import { NextResponse } from "next/server";

export async function GET(req) {
  // const provider = new Provider({ provider: "plaid" });

  // const data = await provider.getTransactions({
  //   teamId: "dd6a039e-d071-423a-9a4d-9ba71325d890",
  //   accountId: "c16a6d43-f121-41bc-ab82-1636029470bc",
  //   // dateFrom: "2024-01-01",
  //   // dateTo: "2024-01-31",
  // });

  // const data = await provider.getAccounts({
  //   id: "b3b06174-e7a0-4cd4-ae64-8d966d58a305",
  //   accessToken: "test_token_4bxszkdl4z6ji",
  //   userId: "123",
  //   teamId: "123",
  //   accountId: "123",
  //   bankConnectionId: "123",
  // });

  // const data = await provider.getTransactions({
  //   teamId: "123",
  //   accessToken: "access-sandbox-fa4c2b4c-1b25-4e66-a8be-504fa51bf5a3",
  //   bankAccountId: "a87e60b9-8323-4bab-8dc9-4ac9786b48a6",
  //   accountId: "AG7EkLW7DRSVaN8Z75jMT1DJN51QpWc9LKB7w",
  // });

  const provider = new Provider({ provider: "gocardless" });

  const data = await provider.getTransactions({
    teamId: "123",
    bankAccountId: "a87e60b9-8323-4bab-8dc9-4ac9786b48a6",
    accountId: "a4575ce2-3dd5-402d-9ca4-1dd287d1b524",
  });

  // const data = await provider.getAccounts({
  //   id: "b3b06174-e7a0-4cd4-ae64-8d966d58a305",
  //   countryCode: "SE",
  // });

  return NextResponse.json(data);
}
