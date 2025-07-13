"use client";

import { useOAuthParams } from "@/hooks/use-oauth-params";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Separator } from "@midday/ui/separator";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle, ExternalLink, Globe, Shield, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SCOPE_DESCRIPTIONS = {
  "transactions.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read access to Transactions",
  },
  "transactions.write": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read and write access to Transactions",
  },
  "tracker-entries.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read access to Tracker",
  },
  "tracker-entries.write": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read and write access to Tracker",
  },
  "tracker-projects.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read access to Tracker",
  },
  "tracker-projects.write": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read and write access to Tracker",
  },
  "invoices.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read access to Invoices",
  },
  "invoices.write": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read and write access to Invoices",
  },
  "inbox.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read access to Inbox",
  },
  "inbox.write": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read and write access to Inbox",
  },
  "customers.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read access to Customers",
  },
  "customers.write": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read and write access to Customers",
  },
  "documents.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read access to Documents",
  },
  "documents.write": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read and write access to Documents",
  },
  "bank-accounts.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read access to Bank Accounts",
  },
  "bank-accounts.write": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read and write access to Bank Accounts",
  },
  "tags.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read access to Tags",
  },
  "tags.write": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read and write access to Tags",
  },
  "teams.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read access to Teams",
  },
  "teams.write": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read and write access to Teams",
  },
  "users.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read access to Users",
  },
  "users.write": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read and write access to Users",
  },
  "metrics.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read access to Metrics",
  },
  "search.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read access to Search",
  },
  "apis.all": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Full access to all resources",
  },
  "apis.read": {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Read-only access to all resources",
  },
} as const;

function getScopeDescription(scope: string) {
  return (
    SCOPE_DESCRIPTIONS[scope as keyof typeof SCOPE_DESCRIPTIONS] || {
      icon: <CheckCircle className="h-4 w-4" />,
      label: scope,
    }
  );
}

type Team = {
  id: string | null;
  name: string | null;
  plan: string | null;
  role: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  logoUrl: string | null;
};

export function OAuthConsentScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const {
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
  } = useOAuthParams();

  const trpc = useTRPC();

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
          variant: "destructive",
        });
      },
    }),
  );

  const handleAuthorize = async () => {
    if (!selectedTeamId) {
      toast({
        title: "Error",
        description: "Please select a workspace",
        variant: "destructive",
      });
      return;
    }

    if (!applicationInfo || !clientId || !redirectUri) {
      toast({
        title: "Error",
        description: "Application information not available",
        variant: "destructive",
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
      codeChallengeMethod: codeChallengeMethod || undefined,
      teamId: selectedTeamId,
    });
  };

  const handleDecline = async () => {
    if (!clientId || !redirectUri) return;

    authorizeMutation.mutate({
      clientId,
      decision: "deny",
      scopes: [],
      redirectUri,
      state: state || undefined,
      codeChallenge: codeChallenge || undefined,
      codeChallengeMethod: codeChallengeMethod || undefined,
      teamId: selectedTeamId || "",
    });
  };

  if (!applicationInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              Authorization Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Invalid authorization request. Please check the parameters and try
              again.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
          <CardTitle className="text-xl">
            {applicationInfo.name} is requesting API access to a workspace in
            Midday.
          </CardTitle>
          <CardDescription>
            {applicationInfo.description && (
              <div className="mt-2 text-sm text-muted-foreground">
                {applicationInfo.description}
              </div>
            )}
            <div className="mt-2 text-sm text-muted-foreground">
              Built by{" "}
              {applicationInfo.website ? (
                <a
                  href={applicationInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <Globe className="h-3 w-3" />
                  {new URL(applicationInfo.website).hostname}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                "Unknown"
              )}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Grant permissions</Label>
            <div className="mt-2 space-y-2">
              {applicationInfo.scopes.map((scope: string) => {
                const description = getScopeDescription(scope);
                return (
                  <div key={scope} className="flex items-center gap-2">
                    <div className="text-green-500">{description.icon}</div>
                    <span className="text-sm text-muted-foreground">
                      {description.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <Label htmlFor="workspace" className="text-sm font-medium">
              Select a workspace to grant api access to
            </Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Search workspaces" />
              </SelectTrigger>
              <SelectContent>
                {teams?.map((team: Team) => (
                  <SelectItem key={team.id} value={team.id!}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
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
