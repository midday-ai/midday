import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  tag: z.enum(["bank"]),
  id: z.string(),
});

const cacheTags = {
  bank: [
    "transactions",
    "bank_connections",
    "bank_accounts",
    "insights",
    "spending",
    "bank_accounts_currencies",
    "bank_accounts_balances",
    "metrics",
    "expenses",
    "burn_rate",
    "runway",
  ],
  vault: ["vault"],
} as const;

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const apiKey = authHeader?.split("Bearer ")?.at(1);

  if (apiKey !== process.env.MIDDAY_CACHE_API_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized request" },
      { status: 401 },
    );
  }

  const parsedBody = schema.safeParse(await req.json());

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { tag, id } = parsedBody.data;

  if (!(tag in cacheTags)) {
    return NextResponse.json({ error: "Invalid tag" }, { status: 400 });
  }

  for (const cacheTag of cacheTags[tag]) {
    revalidateTag(`${cacheTag}_${id}`);
  }

  return NextResponse.json({ success: true });
}
