"use client";

import { CopyInput } from "@/components/copy-input";
import { useTeamQuery } from "@/hooks/use-team";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";

export function TeamIdSection() {
  const { data: team } = useTeamQuery();

  if (!team?.id) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team ID</CardTitle>
        <CardDescription>
          This is your team's unique identifier within Abacus.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <CopyInput value={team.id} />
      </CardContent>

      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Used when interacting with the Abacus API.
        </p>
      </CardFooter>
    </Card>
  );
}
