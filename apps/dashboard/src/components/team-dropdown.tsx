"use client";

import { changeTeamAction } from "@/actions/change-team-action";
import { CreateTeamModal } from "@/components/modals/create-team-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Dialog } from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { useClickAway } from "@uidotdev/usehooks";
import { AnimatePresence, motion } from "framer-motion";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

/**
 * TeamDropdown component for displaying and managing team selection.
 *
 * This component renders a dropdown menu that allows users to switch between
 * different teams or create a new team. It uses Framer Motion for animations
 * and integrates with a team change action.
 *
 * @param props - The props for the TeamDropdown component
 * @returns A React component that renders the team dropdown
 */
export function TeamDropdown({ selectedTeamId: initialId, teams }) {
  const [selectedId, setSelectedId] = useState(initialId);
  const [isActive, setActive] = useState(false);
  const [isOpen, onOpenChange] = useState(false);
  const changeTeam = useAction(changeTeamAction);

  const sortedTeams = [...teams, { team: { id: "add" } }].sort((a, b) => {
    if (a.team.id === selectedId) return -1;
    if (b.team.id === selectedId) return 1;
    return a.team.id - b.team.id;
  });

  const selectedTeam = sortedTeams.find(({ team }) => team.id === selectedId);
  const otherTeams = sortedTeams.filter(({ team }) => team.id !== selectedId);

  const ref = useClickAway(() => {
    setActive(false);
  });

  const toggleActive = () => setActive((prev) => !prev);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <motion.div ref={ref} layout className="md:w-[300px] relative z-50">
        <div
          className="w-full h-[32px] flex items-center px-2 rounded-sm border border-[#DCDAD2] dark:border-[#2C2C2C] cursor-pointer bg-white dark:bg-gray-800"
          onClick={toggleActive}
        >
          <Avatar className="w-[24px] h-[24px] mr-2">
            <AvatarImage src={selectedTeam?.team?.logo_url} />
            <AvatarFallback className="text-xs">
              {selectedTeam?.team?.name?.charAt(0)?.toUpperCase()}
              {selectedTeam?.team?.name?.charAt(1)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm truncate flex-grow">
            {selectedTeam?.team?.name}
          </span>
          <Icons.ChevronDown
            className={`ml-2 transition-transform ${isActive ? "rotate-180" : ""}`}
          />
        </div>

        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-sm shadow-lg overflow-hidden z-50"
            >
              {otherTeams.map(({ team }, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {team.id === "add" ? (
                    <Button
                      className="w-full h-[32px] flex items-center justify-start px-2 shadow-none"
                      variant="ghost"
                      onClick={() => {
                        onOpenChange(true);
                        setActive(false);
                      }}
                    >
                      <Icons.Add className="mr-2" />
                      <span>Add or create team</span>
                    </Button>
                  ) : (
                    <div
                      className="w-full h-[32px] flex items-center px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        setSelectedId(team.id);
                        setActive(false);
                        changeTeam.execute({
                          teamId: team.id,
                          redirectTo: "/",
                        });
                      }}
                    >
                      <Avatar className="w-[24px] h-[24px] mr-2">
                        <AvatarImage src={team?.logo_url} />
                        <AvatarFallback className="text-xs">
                          {team?.name?.charAt(0)?.toUpperCase()}
                          {team?.name?.charAt(1)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate">{team?.name}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <CreateTeamModal onOpenChange={onOpenChange} />
    </Dialog>
  );
}
