import { PlaidApi } from "@midday/providers/src/plaid/plaid-api";
import { getSession } from "@midday/supabase/cached-queries";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const api = new PlaidApi();

    const {
      data: { session },
    } = await getSession();

    const response = await api.linkTokenCreate({
      userId: session?.user.id,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.log(error);
  }
}
