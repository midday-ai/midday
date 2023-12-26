import { getUser } from "@midday/supabase/cached-queries";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Input } from "@midday/ui/input";

export async function TeamMenu() {
  const { data: userData } = await getUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="rounded-sm w-9 h-9">
          <AvatarImage src={userData?.team?.logo_url} />
          <AvatarFallback className="rounded-sm w-9 h-9">
            <span className="text-xs">
              {userData?.team?.name?.charAt(0)?.toUpperCase()}
              {userData?.team?.name?.charAt(1)?.toUpperCase()}
            </span>
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[240px]"
        sideOffset={15}
        align="start"
        side="top"
      >
        <Dialog>
          <DropdownMenuItem asDialogTrigger>
            <DialogTrigger>Create team</DialogTrigger>
          </DropdownMenuItem>
          <DialogContent className="max-w-[455px]">
            <div className="p-4">
              <DialogHeader>
                <DialogTitle>Create team</DialogTitle>
                <DialogDescription>
                  For example, you can use the name of your company or
                  department.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 mb-6">
                <Input placeholder="Team Name" />
              </div>

              <DialogFooter>
                <div className="space-x-4">
                  <Button variant="outline">Cancel</Button>
                  <Button>Continue</Button>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
          {/* <DropdownMenuItem>Members</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem> */}
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
