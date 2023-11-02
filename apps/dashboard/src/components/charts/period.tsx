import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/utils";

export function Period({ className }) {
  return (
    <div className={cn("flex space-x-4", className)}>
      <Button variant="outline" className="flex space-x-2 items-center">
        <span>Oct 08, 2022 - Oct 08, 2023</span>
        <Icons.ChevronDown />
      </Button>
      <Button variant="outline" className="flex space-x-2 items-center">
        <span>Monthly</span>
        <Icons.ChevronDown />
      </Button>
    </div>
  );
}
