"use client";

import { TeamSchema, UserSchema, UserWithTeam } from "@midday/supabase/types";
import { ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ChangeTeamButton } from "./buttons/team/change-team-button";

const DICEBEAR_AVATAR_URL = "https://api.dicebear.com/7.x/micah/svg?seed=";

interface TeamSwitcherProps {
    mode?: "button" | "dropdown";
    user: UserWithTeam | null;
    teams: TeamSchema[];
    currentTeamId?: string;
}

export default function TeamSwitcher({ mode = "dropdown", user, teams, currentTeamId }: TeamSwitcherProps) {
    const selected = useMemo(() => {
        const selectedTeam = teams.find((team) => team.id === currentTeamId);

        if (currentTeamId && teams.length && selectedTeam) {
            return {
                ...selectedTeam,
                image: selectedTeam.logo_url || `${DICEBEAR_AVATAR_URL}${selectedTeam.name}`,
            };
        } else {
            return {
                name: user?.full_name || user?.email,
                slug: "/",
                image: user?.avatar_url || `${DICEBEAR_AVATAR_URL}${user?.email}`,
            };
        }
    }, [currentTeamId, teams, user]) as {
        id?: string;
        name: string;
        slug: string;
        image: string;
    };

    const [openPopover, setOpenPopover] = useState(false);

    if (!user || teams.length === 0) {
        return <TeamSwitcherPlaceholder />;
    }

    if (mode === "button") {
        return (
            <ChangeTeamButton
                currentTeamId={user.team?.id}
                teams={teams}
            />
        );
    }

    return (
        <div>
            <div className="relative inline-block text-left">
                <button
                    onClick={() => setOpenPopover(!openPopover)}
                    className="flex items-center justify-between rounded-lg bg-white p-1.5 text-left text-sm transition-all duration-75 hover:bg-gray-100 focus:outline-none active:bg-gray-200"
                >
                    <div className="flex items-center space-x-3 pr-2">
                        <Image
                            src={selected.image}
                            width={32}
                            height={32}
                            alt={selected.id || selected.name}
                            className="h-8 w-8 rounded-full"
                        />
                        <div className="flex items-center space-x-3 sm:flex">
                            <span className="inline-block max-w-[100px] truncate text-sm font-medium sm:max-w-[200px]">
                                {selected.name}
                            </span>
                        </div>
                    </div>
                    <ChevronsUpDown
                        className="h-4 w-4 text-gray-400"
                        aria-hidden="true"
                    />
                </button>
                {openPopover && (
                    <TeamList
                        selected={selected}
                        teams={teams}
                        setOpenPopover={setOpenPopover}
                    />
                )}
            </div>
        </div>
    );
}

function TeamList({
    selected,
    teams,
    setOpenPopover,
}: {
    selected: {
        name: string;
        slug: string;
        image: string;
    };
    teams: TeamSchema[];
    setOpenPopover: (open: boolean) => void;
}) {
    const pathname = usePathname();

    const href = useCallback(
        (slug: string) => {
            if (selected.slug === "/") {
                return `/${slug}`;
            } else {
                return pathname?.replace(selected.slug, slug).split("?")[0] || "/";
            }
        },
        [pathname, selected.slug]
    );

    return (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
                {teams.map((team) => (
                    <Link
                        key={team.id}
                        href={href(team.logo_url as string)}
                        className={`block px-4 py-2 text-sm ${selected.slug === team.logo_url
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-700"
                            }`}
                        onClick={() => setOpenPopover(false)}
                    >
                        {team.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}

function TeamSwitcherPlaceholder() {
    return (
        <div className="flex animate-pulse items-center space-x-1.5 rounded-lg px-1.5 py-2 sm:w-60">
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            <div className="hidden h-8 w-28 animate-pulse rounded-md bg-gray-200 sm:block sm:w-40" />
            <ChevronsUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </div>
    );
}