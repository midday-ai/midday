"use client";

import { changeTeamAction } from "@/actions/change-team-action";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { useAction } from "next-safe-action/hooks";

export function SelectTeamTable({ data }) {
  const changeTeam = useAction(changeTeamAction);

  return (
    <Table>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id} className="hover:bg-transparent">
            <TableCell className="border-r-[0px] py-4">
              <div className="flex items-center space-x-4">
                <Avatar className="rounded-full w-8 h-8">
                  <AvatarImageNext
                    src={row.team?.logo_url}
                    alt={row.team?.name ?? ""}
                    width={32}
                    height={32}
                  />
                  <AvatarFallback>
                    <span className="text-xs">
                      {row.team.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{row.team.name}</span>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <div className="flex space-x-3 items-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      changeTeam.execute({
                        teamId: row.team.id,
                        redirectTo: "/",
                      })
                    }
                  >
                    Launch
                  </Button>
                </div>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
