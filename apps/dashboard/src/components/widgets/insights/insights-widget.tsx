import { getUIStateFromAIState } from "@/actions/ai/chat/utils";
import { getLatestChat } from "@/actions/ai/storage";
import { ChatList } from "@/components/chat/chat-list";
import { InsightInput } from "./insight-input";
import { InsightList } from "./insight-list";

export async function InsightsWidget() {
  const chat = await getLatestChat();

  return (
    <div>
      <div className="mt-8 overflow-auto scrollbar-hide pb-32 aspect-square flex flex-col-reverse">
        {chat ? (
          <ChatList messages={getUIStateFromAIState(chat)} />
        ) : (
          <InsightList />
        )}
      </div>
      <InsightInput />
    </div>
  );
}
