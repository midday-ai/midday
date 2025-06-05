import { Chat } from "@/components/chat";
import { Header } from "./header";

export function Assistant() {
  return (
    <div className="overflow-hidden p-0 h-full w-full desktop:max-w-[760px] md:max-w-[760px] md:h-[480px] desktop:h-[480px]">
      <Header />
      <Chat />
    </div>
  );
}
