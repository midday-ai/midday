"use client";

import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Folder = {
  id: string;
  name: string;
};

export function ConnectGoogleDrive() {
  const trpc = useTRPC();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if we're in folder selection mode (returning from OAuth)
  const accountId = searchParams.get("accountId");
  const selectFolder = searchParams.get("selectFolder") === "true";
  const provider = searchParams.get("provider");
  const isGoogleDriveSetup =
    provider === "google_drive" && selectFolder && accountId;

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  // Connect mutation - initiates OAuth flow
  const connectMutation = useMutation(
    trpc.inboxAccounts.connect.mutationOptions({
      onSuccess: (authUrl) => {
        if (authUrl) {
          router.push(authUrl);
        }
      },
    }),
  );

  // Fetch folders when in setup mode
  const foldersQuery = useQuery({
    queryKey: ["google-drive-folders", accountId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/apps/google-drive/folders?accountId=${accountId}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch folders");
      }
      const data = await response.json();
      return data.folders as Folder[];
    },
    enabled: isGoogleDriveSetup,
  });

  // Select folder mutation
  const selectFolderMutation = useMutation({
    mutationFn: async (folder: Folder) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/apps/google-drive/select-folder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            accountId,
            folderId: folder.id,
            folderName: folder.name,
          }),
        },
      );
      if (!response.ok) {
        throw new Error("Failed to select folder");
      }
      return response.json();
    },
    onSuccess: () => {
      // Clear the URL params and refresh
      router.push("/inbox/settings?connected=true&provider=google_drive");
    },
  });

  // If we're in folder selection mode, show the folder picker
  if (isGoogleDriveSetup) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Icons.GoogleDrive className="size-5" />
          <span className="text-sm font-medium">Select folder to watch</span>
        </div>

        <Select
          onValueChange={(value) => {
            const folder = foldersQuery.data?.find((f) => f.id === value);
            if (folder) {
              setSelectedFolder(folder);
            }
          }}
          disabled={foldersQuery.isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                foldersQuery.isLoading ? "Loading folders..." : "Select a folder"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {foldersQuery.data?.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <SubmitButton
          className="w-full"
          disabled={!selectedFolder}
          isSubmitting={selectFolderMutation.isPending}
          onClick={() => {
            if (selectedFolder) {
              selectFolderMutation.mutate(selectedFolder);
            }
          }}
        >
          Start Watching Folder
        </SubmitButton>
      </div>
    );
  }

  // Default: Show connect button
  return (
    <SubmitButton
      className="px-6 py-4 w-full font-medium h-[40px]"
      variant="outline"
      onClick={() => connectMutation.mutate({ provider: "google_drive" })}
      isSubmitting={connectMutation.isPending}
    >
      <div className="flex items-center space-x-2">
        <Icons.GoogleDrive className="size-5" />
        <span>Connect Google Drive</span>
      </div>
    </SubmitButton>
  );
}

