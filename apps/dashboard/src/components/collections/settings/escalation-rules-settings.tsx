"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/cn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Rule = {
  id: string;
  triggerType: string;
  fromStageId: string;
  toStageId: string;
  condition: unknown;
  isActive: boolean | null;
};

type Stage = {
  id: string;
  name: string;
  slug: string;
};

const emptyForm = {
  triggerType: "time_based" as "time_based" | "event_based",
  fromStageId: "",
  toStageId: "",
  daysInStage: 7,
  eventType: "missed_payment",
  isActive: true,
};

const EVENT_TYPES = [
  { value: "missed_payment", label: "Missed Payment" },
  { value: "nsf_returned", label: "NSF / Returned Payment" },
  { value: "consecutive_misses", label: "Consecutive Misses" },
];

export function EscalationRulesSettings() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: rules, isLoading: rulesLoading } = useQuery(
    trpc.collectionConfig.getRules.queryOptions(),
  );

  const { data: stages } = useQuery(
    trpc.collectionConfig.getStages.queryOptions(),
  );

  const upsertMutation = useMutation(
    trpc.collectionConfig.upsertRule.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectionConfig.getRules.queryKey(),
        });
        setEditingId(null);
        setIsAdding(false);
        setForm(emptyForm);
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.collectionConfig.deleteRule.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectionConfig.getRules.queryKey(),
        });
      },
    }),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const stageMap = new Map((stages ?? []).map((s) => [s.id, s.name]));

  function startEdit(rule: Rule) {
    setEditingId(rule.id);
    const cond = (rule.condition ?? {}) as Record<string, unknown>;
    setForm({
      triggerType: rule.triggerType as "time_based" | "event_based",
      fromStageId: rule.fromStageId,
      toStageId: rule.toStageId,
      daysInStage: (cond.daysInStage as number) ?? 7,
      eventType: (cond.eventType as string) ?? "missed_payment",
      isActive: rule.isActive ?? true,
    });
  }

  function buildCondition() {
    if (form.triggerType === "time_based") {
      return { daysInStage: form.daysInStage };
    }
    return { eventType: form.eventType };
  }

  function handleSave(id?: string) {
    if (!form.fromStageId || !form.toStageId) return;
    upsertMutation.mutate({
      id,
      triggerType: form.triggerType,
      fromStageId: form.fromStageId,
      toStageId: form.toStageId,
      condition: buildCondition(),
      isActive: form.isActive,
    });
  }

  if (rulesLoading) {
    return <div className="animate-pulse h-64 bg-muted rounded" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Escalation Rules</h3>
          <p className="text-[11px] text-[#606060] mt-0.5">
            Automatically move cases between stages based on time or events.
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
          Add Rule
        </Button>
      </div>

      {/* Rules list */}
      <div className="border border-border divide-y divide-border">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr_auto_auto] gap-3 px-4 py-2 bg-muted/50 text-[11px] font-medium text-[#606060]">
          <span>Trigger</span>
          <span>From Stage</span>
          <span>To Stage</span>
          <span>Condition</span>
          <span>Active</span>
          <span className="w-14" />
        </div>

        {rules?.map((rule) => (
          <div key={rule.id}>
            {editingId === rule.id ? (
              <div className="p-4">
                <RuleForm
                  form={form}
                  setForm={setForm}
                  stages={stages ?? []}
                  onSave={() => handleSave(rule.id)}
                  onCancel={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  isPending={upsertMutation.isPending}
                />
              </div>
            ) : (
              <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr_auto_auto] gap-3 px-4 py-3 items-center">
                <span className="text-[12px]">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium",
                      rule.triggerType === "time_based"
                        ? "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10"
                        : "bg-purple-100 text-purple-800",
                    )}
                  >
                    {rule.triggerType === "time_based" ? "Time" : "Event"}
                  </span>
                </span>
                <span className="text-[12px]">
                  {stageMap.get(rule.fromStageId) ?? "—"}
                </span>
                <span className="text-[12px]">
                  {stageMap.get(rule.toStageId) ?? "—"}
                </span>
                <span className="text-[12px] text-[#606060]">
                  {rule.triggerType === "time_based"
                    ? `After ${(rule.condition as Record<string, unknown>).daysInStage ?? "?"} days`
                    : EVENT_TYPES.find(
                        (e) =>
                          e.value ===
                          (rule.condition as Record<string, unknown>).eventType,
                      )?.label ??
                      String(
                        (rule.condition as Record<string, unknown>).eventType,
                      )}
                </span>
                <span>
                  <span
                    className={cn(
                      "inline-block w-2 h-2 rounded-full",
                      rule.isActive ? "bg-[#00C969]" : "bg-[#878787]",
                    )}
                  />
                </span>
                <div className="flex items-center gap-1 w-14 justify-end">
                  <button
                    type="button"
                    onClick={() => startEdit(rule)}
                    className="text-[#878787] hover:text-primary p-1"
                  >
                    <Icons.Edit className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate({ id: rule.id })}
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

        {isAdding && (
          <div className="p-4 bg-muted/30">
            <RuleForm
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

        {(!rules || rules.length === 0) && !isAdding && (
          <div className="py-8 text-center">
            <p className="text-[12px] text-[#878787]">
              No escalation rules configured yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RuleForm({
  form,
  setForm,
  stages,
  onSave,
  onCancel,
  isPending,
}: {
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  stages: Stage[];
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#878787]">Trigger Type</label>
          <select
            value={form.triggerType}
            onChange={(e) =>
              setForm({
                ...form,
                triggerType: e.target.value as "time_based" | "event_based",
              })
            }
            className="w-full mt-1 h-8 px-3 text-sm border border-border rounded bg-background"
          >
            <option value="time_based">Time-Based</option>
            <option value="event_based">Event-Based</option>
          </select>
        </div>
        {form.triggerType === "time_based" ? (
          <div>
            <label className="text-xs text-[#878787]">Days in Stage</label>
            <Input
              type="number"
              value={form.daysInStage}
              onChange={(e) =>
                setForm({ ...form, daysInStage: Number(e.target.value) })
              }
              className="h-8 text-sm mt-1"
              min={1}
            />
          </div>
        ) : (
          <div>
            <label className="text-xs text-[#878787]">Event Type</label>
            <select
              value={form.eventType}
              onChange={(e) =>
                setForm({ ...form, eventType: e.target.value })
              }
              className="w-full mt-1 h-8 px-3 text-sm border border-border rounded bg-background"
            >
              {EVENT_TYPES.map((et) => (
                <option key={et.value} value={et.value}>
                  {et.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs text-[#878787]">From Stage</label>
          <select
            value={form.fromStageId}
            onChange={(e) =>
              setForm({ ...form, fromStageId: e.target.value })
            }
            className="w-full mt-1 h-8 px-3 text-sm border border-border rounded bg-background"
          >
            <option value="">Select stage...</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#878787]">To Stage</label>
          <select
            value={form.toStageId}
            onChange={(e) =>
              setForm({ ...form, toStageId: e.target.value })
            }
            className="w-full mt-1 h-8 px-3 text-sm border border-border rounded bg-background"
          >
            <option value="">Select stage...</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
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
            disabled={isPending || !form.fromStageId || !form.toStageId}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
