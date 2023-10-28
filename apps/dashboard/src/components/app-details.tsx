import { VoteButton } from "@/components/vote-button";
import { createClient } from "@vercel/kv";

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function AppDetails({ id, name, description, logo }) {
  const count = await kv.mget(id);

  return (
    <section key={id} className="flex space-x-12 items-center mt-10 pt-10">
      <div className="w-[300px] h-[200px] flex items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#171717] rounded-xl">
        {logo}
      </div>
      <div className="flex-1">
        <h2 className="mb-4 font-medium">{name}</h2>
        <p className="text-sm text-[#606060]">{description}</p>
      </div>

      <VoteButton count={count} id={id} />
    </section>
  );
}
