"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
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
import { Textarea } from "@midday/ui/textarea";
import { toast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const FORMAT_OPTIONS = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel (XLSX)" },
  { value: "pdf", label: "PDF" },
  { value: "quickbooks_iif", label: "QuickBooks IIF" },
  { value: "xero_csv", label: "Xero CSV" },
] as const;

const DEFAULT_COLUMNS = [
  { key: "date", label: "Date", enabled: true },
  { key: "description", label: "Description", enabled: true },
  { key: "amount", label: "Amount", enabled: true },
  { key: "matchStatus", label: "Match Status", enabled: true },
  { key: "dealCode", label: "Deal Code", enabled: true },
  { key: "merchantName", label: "Merchant", enabled: true },
  { key: "confidence", label: "Confidence", enabled: true },
  { key: "bankAccount", label: "Bank Account", enabled: true },
  { key: "discrepancyType", label: "Discrepancy Type", enabled: false },
  { key: "note", label: "Note", enabled: false },
];

type Props = {
  onComplete: () => void;
  onCancel: () => void;
};

export function ExportTemplateForm({ onComplete, onCancel }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("csv");
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleCron, setScheduleCron] = useState("");
  const [scheduleEmail, setScheduleEmail] = useState("");

  const createMutation = useMutation(
    trpc.exportTemplates.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.exportTemplates.getAll.queryKey(),
        });
        toast({ title: "Template created", variant: "success" });
        onComplete();
      },
    }),
  );

  const toggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, enabled: !col.enabled } : col,
      ),
    );
  };

  const handleSubmit = () => {
    createMutation.mutate({
      name,
      description: description || undefined,
      format: format as "csv" | "xlsx" | "pdf" | "quickbooks_iif" | "xero_csv",
      columns,
      scheduleEnabled: scheduleEnabled || undefined,
      scheduleCron: scheduleCron || undefined,
      scheduleEmail: scheduleEmail || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">New Export Template</h2>
          <p className="text-sm text-muted-foreground">
            Configure a reusable export for reconciliation data
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Template Name</Label>
          <Input
            placeholder="e.g., Daily Reconciliation Report"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label>Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMAT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Description (optional)</Label>
        <Textarea
          placeholder="Describe what this template exports..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div>
        <Label className="mb-2 block">Columns</Label>
        <div className="grid grid-cols-2 gap-2">
          {columns.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-muted/50"
            >
              <Switch
                checked={col.enabled}
                onCheckedChange={() => toggleColumn(col.key)}
              />
              <span className="text-sm">{col.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center gap-3 mb-3">
          <Switch
            checked={scheduleEnabled}
            onCheckedChange={setScheduleEnabled}
          />
          <Label>Enable Scheduled Export</Label>
        </div>
        {scheduleEnabled && (
          <div className="grid grid-cols-2 gap-4 pl-8">
            <div>
              <Label>Schedule (cron)</Label>
              <Input
                placeholder="0 18 * * * (daily at 6 PM)"
                value={scheduleCron}
                onChange={(e) => setScheduleCron(e.target.value)}
              />
            </div>
            <div>
              <Label>Email Delivery</Label>
              <Input
                type="email"
                placeholder="david@company.com"
                value={scheduleEmail}
                onChange={(e) => setScheduleEmail(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!name || createMutation.isPending}
        >
          {createMutation.isPending ? "Creating..." : "Create Template"}
        </Button>
      </div>
    </div>
  );
}
