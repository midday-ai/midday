import { PlaidApi } from "@midday/providers/src/plaid/plaid-api";
import { createClient } from "@midday/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = createClient();
    const api = new PlaidApi();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await api.linkTokenCreate({
      userId: session?.user.id,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.log(error);
  }
}
