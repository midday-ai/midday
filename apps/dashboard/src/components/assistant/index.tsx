import { Chat } from "@/components/chat";
import { Header } from "./header";

export function Assistant() {
  return (
    <div className="overflow-hidden p-0 h-full w-full todesktop:max-w-[760px] md:max-w-[760px] md:h-[480px] todesktop:h-[480px]">
      <Header />
      <Chat />
    </div>
  );
}
