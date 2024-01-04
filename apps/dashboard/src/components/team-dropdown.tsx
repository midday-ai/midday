"use client";

import { changeTeamAction } from "@/actions/change-team-action";
import { CreateTeamModal } from "@/components/modals/create-team-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Dialog, DialogTrigger } from "@midday/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useAction } from "next-safe-action/hook";
import { useState } from "react";

export function TeamDropdown({ selectedTeam, teams }) {
  const [isOpen, onOpenChange] = useState(false);
  const changeTeam = useAction(changeTeamAction);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="rounded-sm w-9 h-9">
          <AvatarImage src={selectedTeam?.logo_url} />
          <AvatarFallback className="rounded-sm w-9 h-9">
            <span className="text-xs">
              {selectedTeam?.name?.charAt(0)?.toUpperCase()}
              {selectedTeam?.name?.charAt(1)?.toUpperCase()}
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
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DropdownMenuItem asDialogTrigger className="border-b-[1px]">
            <Button
              className="w-full p-1 flex items-center space-x-2 justify-start"
              variant="ghost"
              onClick={() => onOpenChange(true)}
            >
              <Icons.Add />
              <span className="font-medium text-sm">Create team</span>
            </Button>
          </DropdownMenuItem>

          <CreateTeamModal onOpenChange={onOpenChange} />

          {teams.map(({ team }) => {
            return (
              <DropdownMenuItem
                key={team.id}
                onClick={() =>
                  changeTeam.execute({ teamId: team.id, redirectTo: "/" })
                }
              >
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
                  {team.id === selectedTeam.id && <Icons.Check />}
                </div>
              </DropdownMenuItem>
            );
          })}
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
