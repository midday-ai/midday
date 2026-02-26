"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/cn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Agency = {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  isActive: boolean | null;
};

const emptyForm = {
  name: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  notes: "",
  isActive: true,
};

export function AgenciesSettings() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: agencies, isLoading } = useQuery(
    trpc.collectionConfig.getAgencies.queryOptions(),
  );

  const upsertMutation = useMutation(
    trpc.collectionConfig.upsertAgency.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectionConfig.getAgencies.queryKey(),
        });
        setEditingId(null);
        setIsAdding(false);
        setForm(emptyForm);
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.collectionConfig.deleteAgency.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectionConfig.getAgencies.queryKey(),
        });
      },
    }),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function startEdit(agency: Agency) {
    setEditingId(agency.id);
    setForm({
      name: agency.name,
      contactName: agency.contactName || "",
      contactEmail: agency.contactEmail || "",
      contactPhone: agency.contactPhone || "",
      notes: agency.notes || "",
      isActive: agency.isActive ?? true,
    });
  }

  function handleSave(id?: string) {
    upsertMutation.mutate({
      id,
      name: form.name,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      notes: form.notes || undefined,
      isActive: form.isActive,
    });
  }

  function handleToggleActive(agency: Agency) {
    upsertMutation.mutate({
      id: agency.id,
      name: agency.name,
      contactName: agency.contactName ?? undefined,
      contactEmail: agency.contactEmail ?? undefined,
      contactPhone: agency.contactPhone ?? undefined,
      notes: agency.notes ?? undefined,
      isActive: !agency.isActive,
    });
  }

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted rounded" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Collection Agencies</h3>
          <p className="text-[11px] text-[#606060] mt-0.5">
            Manage external collection agencies for case hand-off.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsAdding(true);
            setForm(emptyForm);
          }}
          disabled={isAdding}
        >
          <Icons.Add className="size-4 mr-1" />
          Add Agency
        </Button>
      </div>

      {/* Agency list */}
      <div className="space-y-3">
        {agencies?.map((agency) => (
          <div
            key={agency.id}
            className={cn(
              "border border-border p-4",
              !agency.isActive && "opacity-60",
            )}
          >
            {editingId === agency.id ? (
              <AgencyForm
                form={form}
                setForm={setForm}
                onSave={() => handleSave(agency.id)}
                onCancel={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                isPending={upsertMutation.isPending}
              />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{agency.name}</span>
                    {!agency.isActive && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-muted text-[#878787] rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-[#606060]">
                    {agency.contactName && (
                      <span>{agency.contactName}</span>
                    )}
                    {agency.contactEmail && (
                      <span>{agency.contactEmail}</span>
                    )}
                    {agency.contactPhone && (
                      <span>{agency.contactPhone}</span>
                    )}
                  </div>
                  {agency.notes && (
                    <p className="text-[11px] text-[#878787] mt-1">
                      {agency.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(agency)}
                    className={cn(
                      "p-1 text-[#878787]",
                      agency.isActive
                        ? "hover:text-amber-600"
                        : "hover:text-green-600",
                    )}
                    title={agency.isActive ? "Deactivate" : "Activate"}
                  >
                    <Icons.Visibility className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(agency)}
                    className="text-[#878787] hover:text-primary p-1"
                  >
                    <Icons.Edit className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate({ id: agency.id })}
                    disabled={deleteMutation.isPending}
                    className="text-[#878787] hover:text-red-600 p-1"
                  >
                    <Icons.Delete className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add new agency */}
        {isAdding && (
          <div className="border border-border p-4 bg-muted/30">
            <AgencyForm
              form={form}
              setForm={setForm}
              onSave={() => handleSave()}
              onCancel={() => {
                setIsAdding(false);
                setForm(emptyForm);
              }}
              isPending={upsertMutation.isPending}
            />
          </div>
        )}

        {(!agencies || agencies.length === 0) && !isAdding && (
          <div className="border border-border py-8 text-center">
            <p className="text-[12px] text-[#878787]">
              No collection agencies configured yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AgencyForm({
  form,
  setForm,
  onSave,
  onCancel,
  isPending,
}: {
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#878787]">Agency Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="h-8 text-sm mt-1"
            placeholder="Agency name"
          />
        </div>
        <div>
          <label className="text-xs text-[#878787]">Contact Name</label>
          <Input
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            className="h-8 text-sm mt-1"
            placeholder="Contact person"
          />
        </div>
        <div>
          <label className="text-xs text-[#878787]">Email</label>
          <Input
            type="email"
            value={form.contactEmail}
            onChange={(e) =>
              setForm({ ...form, contactEmail: e.target.value })
            }
            className="h-8 text-sm mt-1"
            placeholder="agency@example.com"
          />
        </div>
        <div>
          <label className="text-xs text-[#878787]">Phone</label>
          <Input
            value={form.contactPhone}
            onChange={(e) =>
              setForm({ ...form, contactPhone: e.target.value })
            }
            className="h-8 text-sm mt-1"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-[#878787]">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full mt-1 px-3 py-2 text-sm border border-border rounded bg-background resize-none h-16"
          placeholder="Additional notes about this agency..."
        />
      </div>
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-1.5 text-[11px] text-[#606060]">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="accent-primary"
          />
          Active
        </label>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={isPending || !form.name.trim()}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
