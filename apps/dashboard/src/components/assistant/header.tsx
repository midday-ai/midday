import { useAssistantStore } from "@/store/assistant";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function Header() {
  const { setOpen } = useAssistantStore();

  return (
    <div className="px-4 py-3 flex justify-between items-center border-border border-b-[1px]">
      <div className="flex items-center space-x-3">
        <h2>Assistant</h2>
      </div>

      <Button
        className="flex md:hidden todesktop:hidden"
        size="icon"
        variant="ghost"
        onClick={() => setOpen()}
      >
        <Icons.Close />
      </Button>
    </div>
  );
}
