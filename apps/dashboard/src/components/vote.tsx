import { VoteButton } from "@/components/vote-button";
import { client } from "@midday/kv";

export async function Vote({ id }) {
  const count = await client.mget(id);

  return <VoteButton count={count} id={id} />;
}
