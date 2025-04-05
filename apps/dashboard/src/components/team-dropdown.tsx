"use client";

import { changeTeamAction } from "@/actions/change-team-action";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useClickAway } from "@uidotdev/usehooks";
import { AnimatePresence, motion } from "framer-motion";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useEffect, useState } from "react";

export function TeamDropdown() {
  const { data: user } = useUserQuery();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | undefined>(
    user?.team?.id,
  );
  const [isActive, setActive] = useState(false);
  const [isChangingTeam, setIsChangingTeam] = useState(false);

  const changeTeam = useAction(changeTeamAction, {
    onSuccess: () => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: trpc.user.me.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.team.current.queryKey() });

      setIsChangingTeam(false);
    },
  });

  const trpc = useTRPC();
  const { data: teams } = useQuery(trpc.team.list.queryOptions());

  useEffect(() => {
    if (user?.team?.id) {
      setSelectedId(user.team.id);
    }
  }, [user?.team?.id]);

  const sortedTeams =
    teams?.sort((a, b) => {
      if (a.team.id === selectedId) return -1;
      if (b.team.id === selectedId) return 1;

      return a.team.id.localeCompare(b.team.id);
    }) ?? [];

  const ref = useClickAway<HTMLDivElement>(() => {
    if (!isChangingTeam) {
      setActive(false);
    }
  });

  const toggleActive = () => setActive((prev) => !prev);

  const handleTeamChange = (teamId: string) => {
    if (teamId === selectedId) {
      toggleActive();
      return;
    }

    setIsChangingTeam(true);
    setSelectedId(teamId);
    setActive(false);

    changeTeam.execute({ teamId, redirectTo: "/" });
  };

  return (
    <motion.div ref={ref} layout className="w-[32px] h-[32px] relative">
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="w-[32px] h-[32px] left-0 overflow-hidden absolute"
            style={{ zIndex: 1 }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -(32 + 10) * sortedTeams.length, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              mass: 1.2,
            }}
          >
            <Link href="/teams/create" onClick={() => setActive(false)}>
              <Button
                className="w-[32px] h-[32px]"
                size="icon"
                variant="outline"
              >
                <Icons.Add />
              </Button>
            </Link>
          </motion.div>
        )}
        {sortedTeams.map(({ team }, index) => (
          <motion.div
            key={team.id}
            className="w-[32px] h-[32px] left-0 overflow-hidden absolute"
            style={{ zIndex: -index }}
            initial={{
              scale: `${100 - index * 16}%`,
              y: index * 5,
            }}
            animate={
              isActive
                ? {
                    y: -(32 + 10) * index,
                    scale: "100%",
                  }
                : {
                    scale: `${100 - index * 16}%`,
                    y: index * 5,
                  }
            }
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              mass: 1.2,
            }}
          >
            <Avatar
              className="w-[32px] h-[32px] rounded-none border border-[#DCDAD2] dark:border-[#2C2C2C] cursor-pointer"
              onClick={() => {
                if (index === 0) {
                  toggleActive();
                } else {
                  handleTeamChange(team.id);
                }
              }}
            >
              <AvatarImageNext
                src={team.logo_url ?? ""}
                alt={team.name ?? ""}
                width={20}
                height={20}
                quality={100}
              />
              <AvatarFallback className="rounded-none w-[32px] h-[32px]">
                <span className="text-xs">
                  {team?.name?.charAt(0)?.toUpperCase()}
                  {team?.name?.charAt(1)?.toUpperCase()}
                </span>
              </AvatarFallback>
            </Avatar>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
