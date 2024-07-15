import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const res = await req.json();
    // const api = new PlaidApi();

    // const response = await api.itemPublicTokenExchange({
    //   publicToken: res.public_token,
    // });

    // return NextResponse.json(response.data);
  } catch (error) {
    console.log(error);
  }
}
