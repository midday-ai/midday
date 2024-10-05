"use client";

import { ChangeTeamModal } from "@/components/modals/team/change-team-modal";
import { TeamSchema } from "@midday/supabase/types";
import { Button } from "@midday/ui/button";
import React, { useState } from "react";

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
      <Button onClick={handleOpenModal}>Change Team</Button>
      <ChangeTeamModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        teams={teams}
        currentTeamId={currentTeamId}
      />
    </>
  );
}
