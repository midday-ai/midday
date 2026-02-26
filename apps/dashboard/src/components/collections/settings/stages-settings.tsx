"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Stage = {
  id: string;
  name: string;
  slug: string;
  position: number;
  color: string | null;
  isDefault: boolean | null;
  isTerminal: boolean | null;
};

const DEFAULT_COLORS = [
  "#0ea5e9", // sky
  "#f97316", // orange
  "#16a34a", // green
  "#d97706", // amber
  "#dc2626", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function StagesSettings() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: stages, isLoading } = useQuery(
    trpc.collectionConfig.getStages.queryOptions(),
  );

  const upsertMutation = useMutation(
    trpc.collectionConfig.upsertStage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectionConfig.getStages.queryKey(),
        });
        setEditingId(null);
      },
    }),
  );

  const swapMutation = useMutation(
    trpc.collectionConfig.swapStagePositions.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectionConfig.getStages.queryKey(),
        });
      },
    }),
  );

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation(
    trpc.collectionConfig.deleteStage.mutationOptions({
      onSuccess: () => {
        setDeleteError(null);
        queryClient.invalidateQueries({
          queryKey: trpc.collectionConfig.getStages.queryKey(),
        });
      },
      onError: (error) => {
        setDeleteError(error.message);
      },
    }),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editColor, setEditColor] = useState("#0ea5e9");
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editIsTerminal, setEditIsTerminal] = useState(false);

  // "new" for adding a new stage
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#0ea5e9");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [newIsTerminal, setNewIsTerminal] = useState(false);

  function startEdit(stage: Stage) {
    setEditingId(stage.id);
    setEditName(stage.name);
    setEditSlug(stage.slug);
    setEditColor(stage.color || "#0ea5e9");
    setEditIsDefault(stage.isDefault ?? false);
    setEditIsTerminal(stage.isTerminal ?? false);
  }

  function handleSaveEdit(stage: Stage) {
    upsertMutation.mutate({
      id: stage.id,
      name: editName,
      slug: editSlug,
      position: stage.position,
      color: editColor,
      isDefault: editIsDefault,
      isTerminal: editIsTerminal,
    });
  }

  function handleAdd() {
    const sorted = stages ? [...stages].sort((a, b) => a.position - b.position) : [];
    const nextPosition = sorted.length > 0 ? sorted[sorted.length - 1]!.position + 1 : 0;

    upsertMutation.mutate(
      {
        name: newName,
        slug: slugify(newName),
        position: nextPosition,
        color: newColor,
        isDefault: newIsDefault,
        isTerminal: newIsTerminal,
      },
      {
        onSuccess: () => {
          setIsAdding(false);
          setNewName("");
          setNewColor("#0ea5e9");
          setNewIsDefault(false);
          setNewIsTerminal(false);
        },
      },
    );
  }

  function handleDelete(id: string) {
    const stage = stages?.find((s) => s.id === id);
    const confirmed = window.confirm(
      `Delete stage "${stage?.name ?? ""}"? This will fail if any cases are currently in this stage.`,
    );
    if (!confirmed) return;
    deleteMutation.mutate({ id });
  }

  function handleMoveUp(stage: Stage, index: number) {
    if (!stages || index === 0) return;
    const sorted = [...stages].sort((a, b) => a.position - b.position);
    const prev = sorted[index - 1]!;
    swapMutation.mutate({ stageAId: stage.id, stageBId: prev.id });
  }

  function handleMoveDown(stage: Stage, index: number) {
    if (!stages) return;
    const sorted = [...stages].sort((a, b) => a.position - b.position);
    if (index === sorted.length - 1) return;
    const next = sorted[index + 1]!;
    swapMutation.mutate({ stageAId: stage.id, stageBId: next.id });
  }

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted rounded" />;
  }

  const sorted = stages ? [...stages].sort((a, b) => a.position - b.position) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Workflow Stages</h3>
          <p className="text-[11px] text-[#606060] mt-0.5">
            Define the stages a collection case moves through. At least one
            default and one terminal stage are required.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <Icons.Add className="size-4 mr-1" />
          Add Stage
        </Button>
      </div>

      {/* Stage list */}
      <div className="border border-border divide-y divide-border">
        {sorted.map((stage, index) => (
          <div
            key={stage.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => handleMoveUp(stage, index)}
                disabled={index === 0 || swapMutation.isPending}
                className="text-[#878787] hover:text-primary disabled:opacity-30"
              >
                <Icons.ChevronUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(stage, index)}
                disabled={index === sorted.length - 1 || swapMutation.isPending}
                className="text-[#878787] hover:text-primary disabled:opacity-30"
              >
                <Icons.ChevronDown className="size-3.5" />
              </button>
            </div>

            {/* Color dot */}
            {editingId === stage.id ? (
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 p-0"
              />
            ) : (
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: stage.color || "#0ea5e9" }}
              />
            )}

            {/* Name + slug */}
            {editingId === stage.id ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setEditSlug(slugify(e.target.value));
                  }}
                  className="h-8 text-sm"
                  placeholder="Stage name"
                />
                <span className="text-[11px] text-[#878787] font-mono whitespace-nowrap">
                  {editSlug}
                </span>
              </div>
            ) : (
              <div className="flex-1">
                <span className="text-sm font-medium">{stage.name}</span>
                <span className="text-[11px] text-[#878787] ml-2 font-mono">
                  {stage.slug}
                </span>
              </div>
            )}

            {/* Badges / toggles */}
            {editingId === stage.id ? (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] text-[#606060]">
                  <input
                    type="checkbox"
                    checked={editIsDefault}
                    onChange={(e) => setEditIsDefault(e.target.checked)}
                    className="accent-primary"
                  />
                  Default
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-[#606060]">
                  <input
                    type="checkbox"
                    checked={editIsTerminal}
                    onChange={(e) => setEditIsTerminal(e.target.checked)}
                    className="accent-primary"
                  />
                  Terminal
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {stage.isDefault && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                    Default
                  </span>
                )}
                {stage.isTerminal && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium text-[#FFD02B] bg-[#FFD02B]/10 rounded">
                    Terminal
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            {editingId === stage.id ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSaveEdit(stage)}
                  disabled={upsertMutation.isPending || !editName.trim()}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(stage)}
                  className="text-[#878787] hover:text-primary p-1"
                >
                  <Icons.Edit className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(stage.id)}
                  disabled={deleteMutation.isPending}
                  className="text-[#878787] hover:text-red-600 p-1"
                >
                  <Icons.Delete className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add new stage row */}
        {isAdding && (
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
            <div className="w-[22px]" />
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 p-0"
            />
            <div className="flex-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-8 text-sm"
                placeholder="New stage name"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-[#606060]">
                <input
                  type="checkbox"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                  className="accent-primary"
                />
                Default
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-[#606060]">
                <input
                  type="checkbox"
                  checked={newIsTerminal}
                  onChange={(e) => setNewIsTerminal(e.target.checked)}
                  className="accent-primary"
                />
                Terminal
              </label>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdd}
                disabled={upsertMutation.isPending || !newName.trim()}
              >
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete error */}
      {deleteError && (
        <div className="text-[12px] text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 px-3 py-2 rounded">
          {deleteError}
        </div>
      )}

      {/* Validation hint */}
      {stages && stages.length > 0 && (
        <div className="text-[11px] text-[#878787]">
          {!stages.some((s) => s.isDefault) && (
            <span className="text-red-600">
              No default stage set. New cases need a default stage.{" "}
            </span>
          )}
          {!stages.some((s) => s.isTerminal) && (
            <span className="text-amber-600">
              No terminal stage set. Cases cannot be resolved without one.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
