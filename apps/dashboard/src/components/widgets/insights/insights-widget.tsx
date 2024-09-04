import { getUIStateFromAIState } from "@/actions/ai/chat/utils";
import { getLatestChat } from "@/actions/ai/storage";
import { ChatList } from "@/components/chat/chat-list";
import { chatExamples } from "@/components/chat/examples";
import { shuffle } from "@midday/utils";
import { InsightInput } from "./insight-input";
import { InsightList } from "./insight-list";

export async function InsightsWidget() {
  const chat = await getLatestChat();

  const items = shuffle(chatExamples).slice(0, 4);

  return (
    <div>
      <div className="mt-8 overflow-auto scrollbar-hide pb-28 aspect-square flex flex-col-reverse">
        {chat ? (
          <ChatList messages={getUIStateFromAIState(chat)} />
        ) : (
          <InsightList items={items} />
        )}
      </div>
      <InsightInput />
    </div>
  );
}
