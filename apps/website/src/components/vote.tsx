import { VoteButton } from "@/components/vote-button";
import { client } from "@midday/kv";

type Props = {
  id: string;
};

export async function Vote({ id }: Props) {
  const count = await client.mget(`apps:${id}`);

  return <VoteButton count={count.at(0)} id={id} />;
}
