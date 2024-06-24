import { AI } from "@/actions/ai/chat";
import { Assistant } from "@/components/assistant";
import { getUser } from "@midday/supabase/cached-queries";
import { nanoid } from "nanoid";

export default async function Page() {
  const user = await getUser();

  return (
    <AI initialAIState={{ user: user.data, messages: [], chatId: nanoid() }}>
      <Assistant />
    </AI>
  );
}
