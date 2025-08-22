"use client";

import { useOAuthParams } from "@/hooks/use-oauth-params";
import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { getScopeDescription } from "@/utils/scopes";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function OAuthConsentScreen() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: codeChallenge,
  } = useOAuthParams();

  const trpc = useTRPC();
  const { data: currentTeam } = useTeamQuery();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // Preselect the current team when data is available
  useEffect(() => {
    if (currentTeam?.id && !selectedTeamId) {
      setSelectedTeamId(currentTeam.id);
    }
  }, [currentTeam?.id, selectedTeamId]);

  const { data: applicationInfo } = useSuspenseQuery(
    trpc.oauthApplications.getApplicationInfo.queryOptions({
      clientId: clientId!,
      redirectUri: redirectUri!,
      scope: scope!,
      state: state || undefined,
    }),
  );

  const { data: teams } = useSuspenseQuery(trpc.team.list.queryOptions());

  const authorizeMutation = useMutation(
    trpc.oauthApplications.authorize.mutationOptions({
      onSuccess: (data) => {
        window.location.href = data.redirect_url;
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Authorization failed",
          variant: "error",
        });
      },
    }),
  );

  const handleAuthorize = async () => {
    if (!selectedTeamId) {
      toast({
        title: "Error",
        description: "Please select a workspace",
        variant: "error",
      });
      return;
    }

    if (!applicationInfo || !clientId || !redirectUri) {
      toast({
        title: "Error",
        description: "Application information not available",
        variant: "error",
      });
      return;
    }

    authorizeMutation.mutate({
      clientId,
      decision: "allow",
      scopes: applicationInfo.scopes,
      redirectUri,
      state: state || undefined,
      codeChallenge: codeChallenge || undefined,
      teamId: selectedTeamId,
    });
  };

  const handleDecline = async () => {
    if (!clientId || !redirectUri || !selectedTeamId) return;

    authorizeMutation.mutate({
      clientId,
      decision: "deny",
      scopes: [],
      redirectUri,
      state: state || undefined,
      codeChallenge: codeChallenge || undefined,
      teamId: selectedTeamId,
    });
  };

  if (!applicationInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <Card className="w-full max-w-[448px]">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center">
                <X className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-lg mb-2 font-serif">
              Authorization Error
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground text-center">
              Invalid authorization request. Please check the parameters and try
              again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-3 pt-4">
              <Button onClick={() => router.push("/")} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-[448px]">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
              {applicationInfo.logoUrl ? (
                <Image
                  src={applicationInfo.logoUrl}
                  alt={applicationInfo.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-muted rounded-full" />
              )}
            </div>
            <Icons.SyncAlt className="size-4 text-[#666666]" />
            <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
              <Icons.LogoSmall className="h-8 w-8" />
            </div>
          </div>

          <CardTitle className="text-lg mb-2 font-serif">
            {applicationInfo.name} is requesting API access <br /> to a team in
            Midday.
          </CardTitle>

          <CardDescription className="text-sm text-muted-foreground text-center">
            <span className="flex items-center justify-center gap-1 text-[#878787] text-sm mb-8">
              Built by{" "}
              {applicationInfo.website ? (
                <a
                  href={applicationInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline"
                >
                  {applicationInfo.developerName ||
                    new URL(applicationInfo.website).hostname}
                </a>
              ) : (
                <span className="underline">
                  {applicationInfo.developerName || "Unknown"}
                </span>
              )}
            </span>
          </CardDescription>
        </CardHeader>

        {applicationInfo.status !== "approved" && (
          <div className="mx-4 mb-4 px-3 py-2 bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-sm text-amber-700 dark:text-amber-300">
                This app hasn't been verified by Midday yet
              </span>
            </div>
          </div>
        )}

        <CardContent className="space-y-6">
          <div className="space-y-4 border-t border-b border-border border-dashed py-6">
            <span className="text-sm">Grant permissions</span>
            <div
              className={`${applicationInfo.scopes.length > 3 ? "relative" : ""}`}
            >
              <div
                className={cn(
                  "space-y-4",
                  applicationInfo.scopes.length > 3 &&
                    "max-h-[92px] overflow-y-auto pr-2 pb-2",
                )}
              >
                {applicationInfo.scopes.map((scope) => {
                  const description = getScopeDescription(scope);
                  return (
                    <div key={scope} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <Check className="size-3.5 text-[#878787]" />
                      </div>
                      <span className="text-sm text-[#878787]">
                        {description.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {applicationInfo.scopes.length > 3 && (
                <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-card to-transparent pointer-events-none" />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="workspace" className="text-sm font-normal">
              Select a team to grant API access to
            </Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Search workspaces" />
              </SelectTrigger>
              <SelectContent>
                {teams?.map((team) => (
                  <SelectItem key={team.id} value={team.id!}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={authorizeMutation.isPending}
              className="flex-1"
            >
              Decline
            </Button>
            <Button
              onClick={handleAuthorize}
              disabled={authorizeMutation.isPending || !selectedTeamId}
              className="flex-1"
            >
              {authorizeMutation.isPending ? "Authorizing..." : "Authorize"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
