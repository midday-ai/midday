"use client";

import { widgetsVisibilityAction } from "@/actions/widgets-visibility-action";
import { useI18n } from "@/locales/client";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { useAction } from "next-safe-action/hooks";

export function WidgetsVisibility({ widgets }) {
  const t = useI18n();
  const toggleVisibility = useAction(widgetsVisibilityAction);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Icons.Tune size={18} />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[200px] p-0" align="end" sideOffset={8}>
        <div className="border-b-[1px] p-4">
          <p className="font-medium text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Hide widgets
          </p>
        </div>

        <div className="flex flex-col p-4 space-y-2 max-h-[352px] overflow-auto">
          {Object.keys(widgets).map((widget) => {
            return (
              <div key={widget} className="flex items-center space-x-2">
                <Checkbox
                  id={widget}
                  checked={widgets[widget]}
                  onCheckedChange={(checked) => {
                    toggleVisibility.execute({
                      ...widgets,
                      [widget]: checked,
                    });
                  }}
                />
                <label
                  htmlFor={widget}
                  className="text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t(`widgets.${widget}`)}
                </label>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
