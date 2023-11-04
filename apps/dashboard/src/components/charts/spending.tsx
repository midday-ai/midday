import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Suspense } from "react";
import { SpendingChart } from "./spending-chart";

export function Spending() {
  return (
    <div className="flex-1 border p-8 relative">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl">Spending</h2>

            <Icons.ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuCheckboxItem checked>
            This month
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Last month</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>This year</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Last year</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="h-[350px]">
        <Suspense fallback={<p>Loading..</p>}>
          <SpendingChart />
        </Suspense>
      </div>
    </div>
  );
}
