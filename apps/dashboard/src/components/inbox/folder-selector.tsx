"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Skeleton } from "@midday/ui/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface Folder {
  id: string;
  name: string;
  path: string;
  parentPath?: string;
  children?: Folder[];
}

interface FolderSelectorProps {
  provider: string;
  connectionId: string;
  onSave: (paths: string[]) => void;
  onCancel?: () => void;
}

function FolderTreeItem({
  folder,
  selectedPaths,
  onToggle,
  level = 0,
}: {
  folder: Folder;
  selectedPaths: Set<string>;
  onToggle: (path: string) => void;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const isSelected = selectedPaths.has(folder.path);
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-accent rounded-md cursor-pointer"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex items-center justify-center w-4 h-4"
          >
            {expanded ? (
              <Icons.ChevronDown className="w-3 h-3" />
            ) : (
              <Icons.ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(folder.path)}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-sm">{folder.name}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              selectedPaths={selectedPaths}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderSelector({
  provider,
  connectionId,
  onSave,
  onCancel,
}: FolderSelectorProps) {
  const trpc = useTRPC();
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  // Use provider-specific query
  const foldersQuery =
    provider === "googledrive"
      ? trpc.apps.getGoogleDriveFolders.queryOptions({ connectionId })
      : trpc.apps.getDropboxFolders.queryOptions({ connectionId });

  const { data: folders, isLoading } = useQuery(foldersQuery);

  // Use provider-specific mutation
  const saveMutationOptions =
    provider === "googledrive"
      ? trpc.apps.saveGoogleDriveFolders.mutationOptions({
          onSuccess: () => {
            onSave(Array.from(selectedPaths));
          },
        })
      : trpc.apps.saveDropboxFolders.mutationOptions({
          onSuccess: () => {
            onSave(Array.from(selectedPaths));
          },
        });

  const saveMutation = useMutation(saveMutationOptions);

  const handleToggle = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (selectedPaths.size === 0) {
      return;
    }
    saveMutation.mutate({
      connectionId,
      folders: Array.from(selectedPaths),
    });
  };

  // Build folder tree structure
  const buildFolderTree = (folders: Folder[]): Folder[] => {
    const folderMap = new Map<string, Folder>();
    const rootFolders: Folder[] = [];

    // First pass: create all folders
    folders.forEach((folder) => {
      folderMap.set(folder.path, { ...folder, children: [] });
    });

    // Second pass: build tree structure
    folders.forEach((folder) => {
      const folderWithChildren = folderMap.get(folder.path)!;
      if (folder.parentPath && folderMap.has(folder.parentPath)) {
        const parent = folderMap.get(folder.parentPath)!;
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(folderWithChildren);
      } else {
        rootFolders.push(folderWithChildren);
      }
    });

    return rootFolders;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!folders || folders.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-[#878787]">
        No folders found in your {provider === "dropbox" ? "Dropbox" : "Google Drive"} account.
      </div>
    );
  }

  const folderTree = buildFolderTree(folders);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Select folders to watch</h3>
        <p className="text-xs text-[#878787] mb-4">
          Choose which {provider === "dropbox" ? "Dropbox" : "Google Drive"} folders should be monitored for receipts and
          invoices.
        </p>
      </div>

      <ScrollArea className="h-[400px] border rounded-md p-2">
        <div className="space-y-1">
          {folderTree.map((folder) => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              selectedPaths={selectedPaths}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between">
        <div className="text-sm text-[#878787]">
          {selectedPaths.size > 0
            ? `${selectedPaths.size} folder${selectedPaths.size === 1 ? "" : "s"} selected`
            : "No folders selected"}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={selectedPaths.size === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save Folders"}
          </Button>
        </div>
      </div>
    </div>
  );
}
