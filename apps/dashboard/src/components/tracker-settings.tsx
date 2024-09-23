"use client";

import type { UpdateUserFormValues } from "@/actions/schema";
import { updateUserAction } from "@/actions/update-user-action";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useAction } from "next-safe-action/hooks";

type Props = {
  timeFormat: number;
  weekStartsOnMonday: boolean;
};

export function TrackerSettings({ timeFormat, weekStartsOnMonday }: Props) {
  const updateUser = useAction(updateUserAction);

  console.log(timeFormat);

  const handleUpdateUser = (data: UpdateUserFormValues) => {
    updateUser.execute({ ...data, revalidatePath: "/tracker" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Icons.Tune size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end" sideOffset={10}>
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Time Format</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={timeFormat === 24 ? "24" : "12"}
                  onValueChange={(value) =>
                    handleUpdateUser({ time_format: +value })
                  }
                >
                  <DropdownMenuRadioItem value="24">
                    24 hours clock
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="12">
                    12 hours clock (AM/PM)
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span>Start week on Monday</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={weekStartsOnMonday ? "yes" : "no"}
                onValueChange={(value) =>
                  handleUpdateUser({ week_starts_on_monday: value === "yes" })
                }
              >
                <DropdownMenuRadioItem value="yes">Yes</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="no">No</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
