import { VoteButton } from "@/components/vote-button";
import { createClient } from "@vercel/kv";

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function Vote({ id }) {
  const count = await kv.mget(id);

  return <VoteButton count={count} id={id} />;
}
