import { useTransactionsStore } from "@/store/transactions";
import { Button } from "@absplatform/ui/button";
import { Checkbox } from "@absplatform/ui/checkbox";
import { Icons } from "@absplatform/ui/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@absplatform/ui/popover";

export function ColumnVisibility({ disabled }: { disabled?: boolean }) {
  const { columns } = useTransactionsStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" disabled={disabled}>
          <Icons.Tune size={18} />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[200px] p-0" align="end" sideOffset={8}>
        <div className="flex flex-col p-4 space-y-2 max-h-[352px] overflow-auto">
          {columns
            .filter((column: any) =>
              column.columnDef.enableHiding === false ? false : true,
            )
            .map((column: any) => {
              return (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(checked) =>
                      column.toggleVisibility(checked)
                    }
                  />
                  <label
                    htmlFor={column.id}
                    className="text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {column.columnDef.header}
                  </label>
                </div>
              );
            })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
