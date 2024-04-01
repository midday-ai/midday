import { PlaidApi } from "@midday/providers/src/plaid/plaid-api";
import { createClient } from "@midday/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = createClient();
    const api = new PlaidApi();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const response = await api.linkTokenCreate({
      userId: user.id,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.log(error);
  }
}
