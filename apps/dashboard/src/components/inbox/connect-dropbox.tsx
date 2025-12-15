"use client";

import { useTRPC } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FolderSelector } from "./folder-selector";

export function ConnectDropbox() {
  const trpc = useTRPC();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  // Check for OAuth callback
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const connectMutation = useMutation(
    trpc.apps.connectDropbox.mutationOptions({
      onSuccess: (data) => {
        setConnectionId(data.connectionId);
        setShowFolderDialog(true);
        // Remove code from URL
        router.replace(window.location.pathname);
      },
    }),
  );

  // Handle OAuth callback
  useEffect(() => {
    if (code && !connectionId && !connectMutation.isPending) {
      connectMutation.mutate({ code });
    }
  }, [code]);

  const handleConnect = () => {
    // Get OAuth URL from InboxConnector
    // For now, we'll construct it manually since we need to handle it differently
    const clientId = process.env.NEXT_PUBLIC_DROPBOX_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_DROPBOX_REDIRECT_URI || 
      `${window.location.origin}${window.location.pathname}`;

    if (!clientId || !redirectUri) {
      console.error("Dropbox OAuth credentials not configured");
      return;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      token_access_type: "offline",
      scope: "files.content.read files.metadata.read account_info.read",
    });

    const authUrl = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
    router.push(authUrl);
  };

  const handleFolderSave = () => {
    setShowFolderDialog(false);
    // Refresh the page or show success message
    router.refresh();
  };

  return (
    <>
      <SubmitButton
        className="px-6 py-4 w-full font-medium h-[40px]"
        variant="outline"
        onClick={handleConnect}
        isSubmitting={connectMutation.isPending}
      >
        <div className="flex items-center space-x-2">
          <Icons.Dropbox />
          <span>Connect Dropbox</span>
        </div>
      </SubmitButton>

      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Dropbox Folders</DialogTitle>
            <DialogDescription>
              Choose which folders should be monitored for receipts and invoices.
            </DialogDescription>
          </DialogHeader>
          {connectionId && (
            <FolderSelector
              provider="dropbox"
              connectionId={connectionId}
              onSave={handleFolderSave}
              onCancel={() => setShowFolderDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
