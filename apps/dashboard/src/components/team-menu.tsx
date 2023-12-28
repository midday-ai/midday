import { getTeams, getUser } from "@midday/supabase/cached-queries";
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
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";

export async function TeamMenu() {
  const { data: userData } = await getUser();
  const { data: teamsData } = await getTeams();

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
          <DropdownMenuItem asDialogTrigger className="border-b-[1px]">
            <DialogTrigger className="w-full p-1 flex items-center space-x-2">
              <Icons.Add />
              <span className="font-medium text-sm">Create team</span>
            </DialogTrigger>
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
          {teamsData.map(({ team }) => {
            return (
              <DropdownMenuItem key={team.id}>
                <div className="flex justify-between w-full p-1">
                  <div className="flex space-x-2 items-center">
                    <Avatar className="rounded-sm w-[24px] h-[24px]">
                      <AvatarImage src={team.logo_url} />
                      <AvatarFallback className="rounded-sm w-[24px] h-[24px]">
                        <span className="text-xs">
                          {team.name?.charAt(0)?.toUpperCase()}
                          {team.name?.charAt(1)?.toUpperCase()}
                        </span>
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{team.name}</span>
                  </div>
                  {team.id === userData.team.id && <Icons.Check />}
                </div>
              </DropdownMenuItem>
            );
          })}
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
