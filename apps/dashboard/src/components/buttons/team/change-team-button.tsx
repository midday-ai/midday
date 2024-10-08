"use client";

import { ChangeTeamModal } from "@/components/modals/team/change-team-modal";
import { TeamSchema } from "@midday/supabase/types";
import { Button } from "@midday/ui/button";
import { SwitchIcon } from "@radix-ui/react-icons";
import { LoaderPinwheel } from "lucide-react";
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
      <Button onClick={handleOpenModal}>
        <LoaderPinwheel className="w-6 h-6 mr-2" />
        Change Team
      </Button>
      <ChangeTeamModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        teams={teams}
        currentTeamId={currentTeamId}
      />
    </>
  );
}
