"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";

type Props = {
  isExpanded?: boolean;
};

export function TeamDropdown({ isExpanded = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { data: user } = useUserQuery();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | undefined>(
    user?.team?.id,
  );
  const [isActive, setActive] = useState(false);
  const [isChangingTeam, setIsChangingTeam] = useState(false);

  const changeTeamMutation = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        setIsChangingTeam(false);
      },
    }),
  );

  const { data: teams } = useQuery(trpc.team.list.queryOptions());

  useEffect(() => {
    if (user?.team?.id) {
      setSelectedId(user.team.id);
    }
  }, [user?.team?.id]);

  const sortedTeams =
    teams?.sort((a, b) => {
      if (a.id === selectedId) return -1;
      if (b.id === selectedId) return 1;

      return (a.id ?? "").localeCompare(b.id ?? "");
    }) ?? [];

  // @ts-expect-error
  useOnClickOutside(ref, () => {
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

    changeTeamMutation.mutate({ teamId });
  };

  return (
    <div className="relative h-[32px]" ref={ref}>
      {/* Avatar - fixed position that absolutely never changes */}
      <div className="fixed left-[19px] bottom-4 w-[32px] h-[32px]">
        <div className="relative w-[32px] h-[32px]">
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
            {sortedTeams.map((team, index) => (
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
                      handleTeamChange(team?.id ?? "");
                    }
                  }}
                >
                  <AvatarImageNext
                    src={team?.logoUrl ?? ""}
                    alt={team?.name ?? ""}
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
        </div>
      </div>

      {/* Team name - appears to the right of the fixed avatar */}
      {isExpanded && sortedTeams[0] && (
        <div className="fixed left-[62px] bottom-4 h-[32px] flex items-center">
          <span
            className="text-sm text-primary truncate transition-opacity duration-200 ease-in-out cursor-pointer hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              toggleActive();
            }}
          >
            {sortedTeams[0].name}
          </span>
        </div>
      )}
    </div>
  );
}
