"use client";

import { useBrandingMutation } from "@/hooks/use-branding-mutation";
import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import type { CollectionsTeamMember, TeamBranding } from "@db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Input } from "@midday/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { SubmitButton } from "@midday/ui/submit-button";
import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export function CollectionsTeam() {
  const { data: team } = useTeamQuery();
  const branding = (team?.branding as TeamBranding) ?? {};
  const brandingMutation = useBrandingMutation();

  const trpc = useTRPC();
  const { data: members } = useQuery(trpc.team.members.queryOptions());

  const [collectionsTeam, setCollectionsTeam] = useState<
    CollectionsTeamMember[]
  >(branding.collectionsTeam ?? []);

  const assignedUserIds = new Set(collectionsTeam.map((m) => m.userId));

  const availableMembers =
    members?.filter(({ user }) => user?.id && !assignedUserIds.has(user.id)) ??
    [];

  const getMemberInfo = (userId: string) => {
    const member = members?.find(({ user }) => user?.id === userId);
    return member?.user;
  };

  const addMember = (userId: string) => {
    setCollectionsTeam((prev) => [...prev, { userId, title: "" }]);
  };

  const removeMember = (userId: string) => {
    setCollectionsTeam((prev) => prev.filter((m) => m.userId !== userId));
  };

  const updateTitle = (userId: string, title: string) => {
    setCollectionsTeam((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, title } : m)),
    );
  };

  const onSave = () => {
    brandingMutation.mutate({
      collectionsTeam: collectionsTeam.map((m) => ({
        userId: m.userId,
        title: m.title || undefined,
      })),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collections team</CardTitle>
        <CardDescription>
          Assign team members to your collections team. These people will be
          available as signers on outbound documents.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {collectionsTeam.map((member) => {
          const user = getMemberInfo(member.userId);
          if (!user) return null;

          return (
            <div
              key={member.userId}
              className="flex items-center gap-3 p-3 rounded-md border"
            >
              <Avatar className="size-8">
                <AvatarImage src={user.avatarUrl ?? undefined} />
                <AvatarFallback>
                  {(user.fullName ?? "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>

              <Input
                value={member.title ?? ""}
                onChange={(e) => updateTitle(member.userId, e.target.value)}
                placeholder="Title (e.g. Collections Manager)"
                className="max-w-[220px] text-sm"
                maxLength={100}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeMember(member.userId)}
              >
                <X className="size-4" />
              </Button>
            </div>
          );
        })}

        {availableMembers.length > 0 && (
          <Select onValueChange={addMember}>
            <SelectTrigger className="max-w-[300px]">
              <div className="flex items-center gap-2">
                <Plus className="size-4" />
                <SelectValue placeholder="Add team member" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-[200px] overflow-y-auto">
              {availableMembers.map(({ user }) => (
                <SelectItem key={user?.id} value={user?.id ?? ""}>
                  {user?.fullName ?? user?.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {collectionsTeam.length === 0 && availableMembers.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No team members available. Add members in the Members settings page
            first.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div>
          {collectionsTeam.length}{" "}
          {collectionsTeam.length === 1 ? "member" : "members"} assigned
        </div>
        <SubmitButton
          isSubmitting={brandingMutation.isPending}
          disabled={brandingMutation.isPending}
          onClick={onSave}
        >
          Save
        </SubmitButton>
      </CardFooter>
    </Card>
  );
}
