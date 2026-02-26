"use client";

import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Label } from "@midday/ui/label";
import { Switch } from "@midday/ui/switch";

export function UnderwritingToggle() {
  const { data: team } = useTeamQuery();
  const updateTeamMutation = useTeamMutation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enable Underwriting</CardTitle>
        <CardDescription>
          When enabled, merchants must complete underwriting before creating
          deals. This adds a document collection and scoring step to your
          workflow.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="underwriting-toggle" className="text-sm">
            Underwriting required for new deals
          </Label>
          <Switch
            id="underwriting-toggle"
            checked={Boolean(team?.underwritingEnabled)}
            disabled={updateTeamMutation.isPending}
            onCheckedChange={(checked) => {
              updateTeamMutation.mutate({
                underwritingEnabled: checked,
              });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
