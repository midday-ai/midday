"use client";

import { changeTeamAction } from "@/actions/change-team-action";
import { CreateTeamForm } from "@/components/forms/create-team-form";
import { TeamSchema } from "@midday/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Dialog } from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { SwitchIcon } from "@radix-ui/react-icons";
import { CheckCircle, Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { CreateTeamModal } from "../create-team-modal";

interface ChangeTeamModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teams: any[];
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

  const sortedTeams = teams.sort((a, b) => {
    if (a.id === selectedTeamId) return -1;
    if (b.id === selectedTeamId) return 1;
    return a.id.localeCompare(b.id);
  });

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="md:min-w-[40%]">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-center mb-4">
              Change Team
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {sortedTeams.map((team) => (
              <div
                key={team.team.id}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 ${selectedTeamId === team.team.id
                  ? "bg-primary/10 border border-primary text-white"
                  : "hover:bg-secondary/80"
                  }`}
                onClick={() => setSelectedTeamId(team.team.id)}
              >
                <Avatar className="w-12 h-12 mr-4 flex-shrink-0">
                  <AvatarImage src={team.team.logo_url ?? undefined} />
                  <AvatarFallback className="text-primary font-bold bg-primary/20">
                    {team.team.name?.slice(0, 2).toUpperCase() ?? ""}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-grow min-w-0">
                  <p className="font-semibold text-foreground text-lg truncate">
                    {team.team.name}
                  </p>
                  {team.team.id === currentTeamId && (
                    <p className="text-sm text-muted-foreground">Current team</p>
                  )}
                </div>
                {selectedTeamId === team.team.id && (
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 ml-2" />
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-between md:min-h-[500px]">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground pt-[1.5%]">
                Changing teams will redirect you to the dashboard of the selected team.
              </p>
              <Button
                onClick={handleTeamChange}
                disabled={selectedTeamId === currentTeamId}
                className="w-full"
              >
                Switch Team
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}