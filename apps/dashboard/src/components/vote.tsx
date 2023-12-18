import { VoteButton } from "@/components/vote-button";
import { client } from "@midday/kv";

export async function Vote({ id }) {
  const count = await client.mget(`apps:v2:${id}`);

  return <VoteButton count={count} id={id} />;
}
