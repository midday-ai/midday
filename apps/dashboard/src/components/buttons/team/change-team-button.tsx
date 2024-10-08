"use client";

import { ChangeTeamSheet } from "@/components/modals/team/change-team-sheet";
import { Button } from "@midday/ui/button";
import { LoaderPinwheel } from "lucide-react";
import { useState } from "react";

interface ChangeTeamButtonProps {
  currentTeamId: any;
  teams: any[];
}

export function ChangeTeamButton({
  currentTeamId,
  teams,
}: ChangeTeamButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  return (
    <>
      <Button onClick={handleOpenModal}>
        <LoaderPinwheel className="w-6 h-6 mr-2" />
        Team
      </Button>
      <ChangeTeamSheet
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        teams={teams}
        currentTeamId={currentTeamId}
      />
    </>
  );
}
