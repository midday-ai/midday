import { AssistantInput } from "./assistant-input";
import { AssistantList } from "./assistant-list";

export function AssistantWidget() {
  return (
    <div>
      <div className="mt-8 overflow-auto scrollbar-hide pb-32 aspect-square flex flex-col-reverse">
        <AssistantList />
        <AssistantInput />
      </div>
    </div>
  );
}
