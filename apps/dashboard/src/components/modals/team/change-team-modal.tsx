"use client";

import { changeTeamAction } from "@/actions/change-team-action";
import { TeamSchema } from "@midday/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

interface ChangeTeamModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teams: TeamSchema[];
  currentTeamId: string;
}

export function ChangeTeamModal({
  isOpen,
  onOpenChange,
  teams,
  currentTeamId,
}: ChangeTeamModalProps) {
  const [selectedTeamId, setSelectedTeamId] = useState(currentTeamId);
  const changeTeam = useAction(changeTeamAction);

  const handleTeamChange = () => {
    if (selectedTeamId !== currentTeamId) {
      changeTeam.execute({ teamId: selectedTeamId, redirectTo: "/" });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-[3%]">
        <DialogHeader>
          <DialogTitle>Change Team</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className={`flex items-center p-2 rounded-md cursor-pointer ${
                selectedTeamId === team.id ? "bg-gray-100 dark:bg-gray-800" : ""
              }`}
              onClick={() => setSelectedTeamId(team.id)}
            >
              <Avatar className="w-10 h-10 mr-4">
                <AvatarImage src={team.logo_url ?? undefined} />
                <AvatarFallback>
                  {team.name?.slice(0, 2).toUpperCase() ?? ""}
                </AvatarFallback>
              </Avatar>
              <p className="text-foreground font-bold">{team.name}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleTeamChange}
            disabled={selectedTeamId === currentTeamId}
          >
            Change Team
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
