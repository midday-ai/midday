"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type SlaConfig = {
  id: string;
  stageId: string | null;
  metric: string;
  thresholdMinutes: number;
};

const METRICS = [
  {
    value: "time_in_stage",
    label: "Time in Stage",
    hint: "Max time a case should stay in this stage",
  },
  {
    value: "response_time",
    label: "Response Time",
    hint: "Max time before first contact attempt",
  },
  {
    value: "resolution_time",
    label: "Resolution Time",
    hint: "Global max time from case creation to resolution",
  },
];

function minutesToDisplay(minutes: number): { value: number; unit: "hours" | "days" } {
  if (minutes >= 1440 && minutes % 1440 === 0) {
    return { value: minutes / 1440, unit: "days" };
  }
  return { value: minutes / 60, unit: "hours" };
}

function displayToMinutes(value: number, unit: "hours" | "days"): number {
  return unit === "days" ? value * 1440 : value * 60;
}

const emptyForm = {
  stageId: "" as string,
  metric: "time_in_stage" as string,
  thresholdValue: 48,
  thresholdUnit: "hours" as "hours" | "days",
};

export function SlaSettings() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: slaConfigs, isLoading: slaLoading } = useQuery(
    trpc.collectionConfig.getSlaConfigs.queryOptions(),
  );

  const { data: stages } = useQuery(
    trpc.collectionConfig.getStages.queryOptions(),
  );

  const upsertMutation = useMutation(
    trpc.collectionConfig.upsertSlaConfig.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectionConfig.getSlaConfigs.queryKey(),
        });
        setEditingId(null);
        setIsAdding(false);
        setForm(emptyForm);
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.collectionConfig.deleteSlaConfig.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectionConfig.getSlaConfigs.queryKey(),
        });
      },
    }),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const stageMap = new Map((stages ?? []).map((s) => [s.id, s.name]));

  function startEdit(config: SlaConfig) {
    const display = minutesToDisplay(config.thresholdMinutes);
    setEditingId(config.id);
    setForm({
      stageId: config.stageId ?? "",
      metric: config.metric,
      thresholdValue: display.value,
      thresholdUnit: display.unit,
    });
  }

  function handleSave(id?: string) {
    const thresholdMinutes = displayToMinutes(
      form.thresholdValue,
      form.thresholdUnit,
    );
    upsertMutation.mutate({
      id,
      stageId: form.stageId || undefined,
      metric: form.metric as "time_in_stage" | "response_time" | "resolution_time",
      thresholdMinutes,
    });
  }

  if (slaLoading) {
    return <div className="animate-pulse h-64 bg-muted rounded" />;
  }

  // Group: stage-specific and global
  const stageConfigs = (slaConfigs ?? []).filter((c) => c.stageId);
  const globalConfigs = (slaConfigs ?? []).filter((c) => !c.stageId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">SLA Thresholds</h3>
          <p className="text-[11px] text-[#606060] mt-0.5">
            Set time limits per stage or globally. Breaches trigger
            notifications and dashboard warnings.
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
          Add Threshold
        </Button>
      </div>

      {/* Global thresholds */}
      {globalConfigs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[12px] font-medium text-[#606060]">
            Global Thresholds
          </h4>
          <div className="border border-border divide-y divide-border">
            {globalConfigs.map((config) => (
              <SlaRow
                key={config.id}
                config={config}
                stageMap={stageMap}
                isEditing={editingId === config.id}
                form={form}
                setForm={setForm}
                onStartEdit={() => startEdit(config)}
                onSave={() => handleSave(config.id)}
                onCancel={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                onDelete={() => deleteMutation.mutate({ id: config.id })}
                isPending={upsertMutation.isPending}
                stages={stages ?? []}
              />
            ))}
          </div>
        </div>
      )}

      {/* Per-stage thresholds */}
      {stageConfigs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[12px] font-medium text-[#606060]">
            Per-Stage Thresholds
          </h4>
          <div className="border border-border divide-y divide-border">
            {stageConfigs.map((config) => (
              <SlaRow
                key={config.id}
                config={config}
                stageMap={stageMap}
                isEditing={editingId === config.id}
                form={form}
                setForm={setForm}
                onStartEdit={() => startEdit(config)}
                onSave={() => handleSave(config.id)}
                onCancel={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                onDelete={() => deleteMutation.mutate({ id: config.id })}
                isPending={upsertMutation.isPending}
                stages={stages ?? []}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add new threshold */}
      {isAdding && (
        <div className="border border-border p-4 bg-muted/30">
          <SlaForm
            form={form}
            setForm={setForm}
            stages={stages ?? []}
            onSave={() => handleSave()}
            onCancel={() => {
              setIsAdding(false);
              setForm(emptyForm);
            }}
            isPending={upsertMutation.isPending}
          />
        </div>
      )}

      {(!slaConfigs || slaConfigs.length === 0) && !isAdding && (
        <div className="border border-border py-8 text-center">
          <p className="text-[12px] text-[#878787]">
            No SLA thresholds configured yet.
          </p>
        </div>
      )}
    </div>
  );
}

function SlaRow({
  config,
  stageMap,
  isEditing,
  form,
  setForm,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
  isPending,
  stages,
}: {
  config: SlaConfig;
  stageMap: Map<string, string>;
  isEditing: boolean;
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  isPending: boolean;
  stages: { id: string; name: string }[];
}) {
  if (isEditing) {
    return (
      <div className="p-4">
        <SlaForm
          form={form}
          setForm={setForm}
          stages={stages}
          onSave={onSave}
          onCancel={onCancel}
          isPending={isPending}
        />
      </div>
    );
  }

  const display = minutesToDisplay(config.thresholdMinutes);
  const metricLabel =
    METRICS.find((m) => m.value === config.metric)?.label ?? config.metric;

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-4">
        {config.stageId && (
          <span className="text-[12px] font-medium">
            {stageMap.get(config.stageId) ?? "Unknown"}
          </span>
        )}
        <span className="text-[12px] text-[#606060]">{metricLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium tabular-nums">
          {display.value} {display.unit}
        </span>
        <button
          type="button"
          onClick={onStartEdit}
          className="text-[#878787] hover:text-primary p-1"
        >
          <Icons.Edit className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-[#878787] hover:text-red-600 p-1"
        >
          <Icons.Delete className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function SlaForm({
  form,
  setForm,
  stages,
  onSave,
  onCancel,
  isPending,
}: {
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  stages: { id: string; name: string }[];
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#878787]">Metric</label>
          <select
            value={form.metric}
            onChange={(e) => setForm({ ...form, metric: e.target.value })}
            className="w-full mt-1 h-8 px-3 text-sm border border-border rounded bg-background"
          >
            {METRICS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-[#878787] mt-0.5">
            {METRICS.find((m) => m.value === form.metric)?.hint}
          </p>
        </div>
        <div>
          <label className="text-xs text-[#878787]">
            Stage{" "}
            <span className="text-[#878787]">
              (blank = global)
            </span>
          </label>
          <select
            value={form.stageId}
            onChange={(e) => setForm({ ...form, stageId: e.target.value })}
            className="w-full mt-1 h-8 px-3 text-sm border border-border rounded bg-background"
          >
            <option value="">Global (all stages)</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#878787]">Threshold</label>
          <div className="flex gap-2 mt-1">
            <Input
              type="number"
              value={form.thresholdValue}
              onChange={(e) =>
                setForm({
                  ...form,
                  thresholdValue: Number(e.target.value),
                })
              }
              className="h-8 text-sm flex-1"
              min={1}
            />
            <select
              value={form.thresholdUnit}
              onChange={(e) =>
                setForm({
                  ...form,
                  thresholdUnit: e.target.value as "hours" | "days",
                })
              }
              className="h-8 px-3 text-sm border border-border rounded bg-background"
            >
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={isPending || form.thresholdValue <= 0}
        >
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
