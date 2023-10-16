import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Settings2 } from "lucide-react";

type Props = {
  columns: any;
};

export function ColumnVisibility({ columns }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="outline" className="rounded-full">
          <Settings2 size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] mr-6 rounded-xl p-0" sideOffset={10}>
        <div className="border-b-[1px] p-4">
          <p className="font-medium text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Hide columns
          </p>
        </div>

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
