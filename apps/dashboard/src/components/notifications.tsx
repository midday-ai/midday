import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function Notifications() {
  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full w-8 h-8 flex items-center"
    >
      <Icons.Notifications />
    </Button>
  );
}
