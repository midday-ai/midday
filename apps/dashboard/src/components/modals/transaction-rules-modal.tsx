"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Switch } from "@midday/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type RuleFormData = {
  name: string;
  merchantMatch: string;
  merchantMatchType: "contains" | "exact" | "starts_with";
  amountOperator: "eq" | "gt" | "lt" | "between" | null;
  amountValue: string;
  amountValueMax: string;
  setCategorySlug: string;
  setMerchantName: string;
  setDealCode: string;
  autoResolveDeal: boolean;
  dateStart: string;
  dateEnd: string;
};

const emptyForm: RuleFormData = {
  name: "",
  merchantMatch: "",
  merchantMatchType: "contains",
  amountOperator: null,
  amountValue: "",
  amountValueMax: "",
  setCategorySlug: "",
  setMerchantName: "",
  setDealCode: "",
  autoResolveDeal: false,
  dateStart: "",
  dateEnd: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: {
    merchantMatch?: string;
    setCategorySlug?: string;
  };
};

export function TransactionRulesModal({
  open,
  onOpenChange,
  prefill,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleFormData>(emptyForm);

  const { data: rules, isLoading } = useQuery({
    ...trpc.transactionRules.get.queryOptions(),
    enabled: open,
  });

  const createMutation = useMutation(
    trpc.transactionRules.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactionRules.get.queryKey(),
        });
        setView("list");
        setForm(emptyForm);
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.transactionRules.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactionRules.get.queryKey(),
        });
        setView("list");
        setEditingId(null);
        setForm(emptyForm);
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.transactionRules.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactionRules.get.queryKey(),
        });
      },
    }),
  );

  const toggleMutation = useMutation(
    trpc.transactionRules.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactionRules.get.queryKey(),
        });
      },
    }),
  );

  const handleCreate = () => {
    setForm({
      ...emptyForm,
      merchantMatch: prefill?.merchantMatch ?? "",
      setCategorySlug: prefill?.setCategorySlug ?? "",
    });
    setView("create");
  };

  const handleEdit = (rule: NonNullable<typeof rules>[number]) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      merchantMatch: rule.merchantMatch ?? "",
      merchantMatchType:
        (rule.merchantMatchType as RuleFormData["merchantMatchType"]) ??
        "contains",
      amountOperator:
        (rule.amountOperator as RuleFormData["amountOperator"]) ?? null,
      amountValue: rule.amountValue?.toString() ?? "",
      amountValueMax: rule.amountValueMax?.toString() ?? "",
      setCategorySlug: rule.setCategorySlug ?? "",
      setMerchantName: rule.setMerchantName ?? "",
      setDealCode: rule.setDealCode ?? "",
      autoResolveDeal: rule.autoResolveDeal ?? false,
      dateStart: rule.dateStart ?? "",
      dateEnd: rule.dateEnd ?? "",
    });
    setView("edit");
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      merchantMatch: form.merchantMatch || null,
      merchantMatchType: form.merchantMatchType,
      amountOperator: form.amountOperator,
      amountValue: form.amountValue ? Number(form.amountValue) : null,
      amountValueMax: form.amountValueMax
        ? Number(form.amountValueMax)
        : null,
      setCategorySlug: form.setCategorySlug || null,
      setMerchantName: form.setMerchantName || null,
      setDealCode: form.setDealCode || null,
      autoResolveDeal: form.autoResolveDeal,
      dateStart: form.dateStart || null,
      dateEnd: form.dateEnd || null,
    };

    if (view === "edit" && editingId) {
      updateMutation.mutate({ ...payload, id: editingId });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[80vh] overflow-auto">
        <div className="p-4">
        <DialogHeader>
          <DialogTitle>
            {view === "list"
              ? "Transaction Rules"
              : view === "create"
                ? "Create Rule"
                : "Edit Rule"}
          </DialogTitle>
          <DialogDescription>
            {view === "list"
              ? "Auto-categorize and organize transactions with rules."
              : "Set criteria to match transactions and actions to apply."}
          </DialogDescription>
        </DialogHeader>

        {view === "list" ? (
          <div className="space-y-3">
            <Button
              onClick={handleCreate}
              size="sm"
              className="w-full gap-2"
            >
              <Icons.Add size={16} />
              Create rule
            </Button>

            {isLoading ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                Loading rules...
              </div>
            ) : !rules?.length ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No rules yet. Create one to auto-categorize transactions.
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between border rounded-md px-3 py-2"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) =>
                          toggleMutation.mutate({
                            id: rule.id,
                            enabled,
                          })
                        }
                      />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            !rule.enabled && "text-muted-foreground",
                          )}
                        >
                          {rule.name}
                        </p>
                        {rule.merchantMatch && (
                          <p className="text-xs text-muted-foreground truncate">
                            Matches: "{rule.merchantMatch}" (
                            {rule.merchantMatchType})
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleEdit(rule)}
                      >
                        <Icons.Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() =>
                          deleteMutation.mutate({ id: rule.id })
                        }
                      >
                        <Icons.Delete size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Rule name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g., Categorize Amazon purchases"
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Match criteria</p>

              <div className="space-y-3">
                <div>
                  <Label className="mb-2 block text-xs text-muted-foreground">
                    Merchant name
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={form.merchantMatchType}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          merchantMatchType:
                            v as RuleFormData["merchantMatchType"],
                        }))
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="exact">Exact match</SelectItem>
                        <SelectItem value="starts_with">
                          Starts with
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={form.merchantMatch}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          merchantMatch: e.target.value,
                        }))
                      }
                      placeholder="e.g., Amazon"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-xs text-muted-foreground">
                    Amount
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={form.amountOperator ?? "none"}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          amountOperator:
                            v === "none"
                              ? null
                              : (v as RuleFormData["amountOperator"]),
                        }))
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="No filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No filter</SelectItem>
                        <SelectItem value="eq">Equals</SelectItem>
                        <SelectItem value="gt">Greater than</SelectItem>
                        <SelectItem value="lt">Less than</SelectItem>
                        <SelectItem value="between">Between</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.amountOperator && (
                      <Input
                        type="number"
                        value={form.amountValue}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            amountValue: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                        className="flex-1"
                      />
                    )}
                    {form.amountOperator === "between" && (
                      <Input
                        type="number"
                        value={form.amountValueMax}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            amountValueMax: e.target.value,
                          }))
                        }
                        placeholder="Max"
                        className="flex-1"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-xs text-muted-foreground">
                    Date range (optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={form.dateStart}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dateStart: e.target.value,
                        }))
                      }
                      placeholder="Start date"
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      value={form.dateEnd}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dateEnd: e.target.value,
                        }))
                      }
                      placeholder="End date"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Actions</p>

              <div className="space-y-3">
                <div>
                  <Label className="mb-2 block text-xs text-muted-foreground">
                    Set category (slug)
                  </Label>
                  <Input
                    value={form.setCategorySlug}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        setCategorySlug: e.target.value,
                      }))
                    }
                    placeholder="e.g., office-supplies"
                  />
                </div>

                <div>
                  <Label className="mb-2 block text-xs text-muted-foreground">
                    Rename merchant to
                  </Label>
                  <Input
                    value={form.setMerchantName}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        setMerchantName: e.target.value,
                      }))
                    }
                    placeholder="e.g., Amazon.com"
                  />
                </div>

                <div>
                  <Label className="mb-2 block text-xs text-muted-foreground">
                    Assign to deal
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Auto-resolve from merchant</span>
                      <Switch
                        checked={form.autoResolveDeal}
                        onCheckedChange={(checked) =>
                          setForm((f) => ({
                            ...f,
                            autoResolveDeal: checked,
                            setDealCode: checked ? "" : f.setDealCode,
                          }))
                        }
                      />
                    </div>
                    {!form.autoResolveDeal && (
                      <Input
                        value={form.setDealCode}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            setDealCode: e.target.value,
                          }))
                        }
                        placeholder="e.g., MCA-2025-001"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setView("list");
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !form.name ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                className="flex-1"
              >
                {view === "edit" ? "Save changes" : "Create rule"}
              </Button>
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
