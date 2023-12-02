import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function CreateFolderButton({ disableActions }) {
  return (
    <Button
      variant="outline"
      className="w-[32px] h-[32px]"
      size="icon"
      disabled={disableActions}
    >
      <Icons.CreateNewFolder />
    </Button>
  );
}
