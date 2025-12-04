"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@midday/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useFormContext } from "react-hook-form";
import type { InvoiceFormValues } from "./form-context";

export function SelectTemplate() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const form = useFormContext<InvoiceFormValues>();
  const [open, setOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [templateName, setTemplateName] = React.useState("");
  const [value, setValue] = React.useState("");

  const templateId = form.watch("templateId");
  const template = form.watch("template");

  const { data: templates } = useQuery(
    trpc.invoiceTemplates.list.queryOptions(),
  );

  const createTemplateMutation = useMutation(
    trpc.invoiceTemplates.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceTemplates.list.queryKey(),
        });
        form.setValue("templateId", data.id);
        setCreateDialogOpen(false);
        setTemplateName("");
        toast({
          title: "Template created",
          description: `Template "${data.name}" has been created.`,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create template.",
          variant: "destructive",
        });
      },
    }),
  );

  const selectedTemplate = templates?.find((t) => t.id === templateId);

  const formatData = templates?.map((item) => ({
    value: item.name,
    label: item.name,
    id: item.id,
    isDefault: item.isDefault,
  }));

  const handleSelect = (id: string) => {
    if (id === "create-template") {
      setCreateDialogOpen(true);
      setOpen(false);
    } else {
      const selected = templates?.find((t) => t.id === id);
      if (selected) {
        form.setValue("templateId", id);
        // Load template data into form
        form.setValue("template", {
          ...template,
          customerLabel: selected.customerLabel ?? template.customerLabel,
          fromLabel: selected.fromLabel ?? template.fromLabel,
          invoiceNoLabel: selected.invoiceNoLabel ?? template.invoiceNoLabel,
          issueDateLabel: selected.issueDateLabel ?? template.issueDateLabel,
          dueDateLabel: selected.dueDateLabel ?? template.dueDateLabel,
          descriptionLabel:
            selected.descriptionLabel ?? template.descriptionLabel,
          priceLabel: selected.priceLabel ?? template.priceLabel,
          quantityLabel: selected.quantityLabel ?? template.quantityLabel,
          totalLabel: selected.totalLabel ?? template.totalLabel,
          vatLabel: selected.vatLabel ?? template.vatLabel,
          taxLabel: selected.taxLabel ?? template.taxLabel,
          paymentLabel: selected.paymentLabel ?? template.paymentLabel,
          noteLabel: selected.noteLabel ?? template.noteLabel,
          logoUrl: selected.logoUrl ?? template.logoUrl,
          currency: selected.currency ?? template.currency,
          subtotalLabel: selected.subtotalLabel ?? template.subtotalLabel,
          discountLabel: selected.discountLabel ?? template.discountLabel,
          totalSummaryLabel:
            selected.totalSummaryLabel ?? template.totalSummaryLabel,
          title: selected.title ?? template.title,
          size: selected.size ?? template.size,
          dateFormat: (selected.dateFormat ?? template.dateFormat) as
            | "dd/MM/yyyy"
            | "MM/dd/yyyy"
            | "yyyy-MM-dd"
            | "dd.MM.yyyy",
          includeVat: selected.includeVat ?? template.includeVat,
          includeTax: selected.includeTax ?? template.includeTax,
          includeDiscount: selected.includeDiscount ?? template.includeDiscount,
          includeDecimals: selected.includeDecimals ?? template.includeDecimals,
          includeUnits: selected.includeUnits ?? template.includeUnits,
          includeQr: selected.includeQr ?? template.includeQr,
          includePdf: selected.includePdf ?? template.includePdf,
          taxRate: selected.taxRate ?? template.taxRate,
          vatRate: selected.vatRate ?? template.vatRate,
          deliveryType: selected.deliveryType ?? template.deliveryType,
        });
        // Update editor fields if they exist in the template
        if (selected.paymentDetails) {
          form.setValue("paymentDetails", selected.paymentDetails);
        }
        if (selected.fromDetails) {
          form.setValue("fromDetails", selected.fromDetails);
        }
        if (selected.noteDetails) {
          form.setValue("noteDetails", selected.noteDetails);
        }
      }
      setOpen(false);
    }
  };

  const handleCreateTemplate = () => {
    if (!templateName.trim()) {
      return;
    }

    const currentValues = form.getValues();
    const isFirstTemplate = !templates || templates.length === 0;

    createTemplateMutation.mutate({
      name: templateName.trim(),
      isDefault: isFirstTemplate,
      ...currentValues.template,
      paymentDetails: currentValues.paymentDetails,
      fromDetails: currentValues.fromDetails,
      noteDetails: currentValues.noteDetails,
    });
  };

  if (!templates || templates.length === 0) {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCreateDialogOpen(true)}
          className="text-[#434343] p-0 text-[11px] h-auto hover:bg-transparent"
        >
          Create template
        </Button>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>
                Enter a name for your new invoice template.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Standard Invoice"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateTemplate();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setTemplateName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTemplate}
                disabled={
                  !templateName.trim() || createTemplateMutation.isPending
                }
              >
                {createTemplateMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            aria-expanded={open}
            className="text-[#434343] p-0 text-[11px] h-auto hover:bg-transparent"
          >
            {selectedTemplate?.name || "Select template"}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[200px] p-0"
          side="bottom"
          sideOffset={10}
          align="start"
        >
          <Command>
            <CommandInput
              value={value}
              onValueChange={setValue}
              placeholder="Search template..."
              className="p-2 text-xs"
            />
            <CommandList className="max-h-[180px] overflow-auto">
              <CommandEmpty className="text-xs border-t-[1px] border-border p-2">
                <button
                  type="button"
                  onClick={() => setCreateDialogOpen(true)}
                  className="w-full text-left"
                >
                  Create template
                </button>
              </CommandEmpty>
              <CommandGroup>
                {formatData?.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.value}
                    onSelect={() => handleSelect(item.id)}
                    className="group text-xs"
                  >
                    <span className="flex items-center gap-1">
                      {item.label}
                      {item.isDefault && (
                        <span className="text-[10px] text-muted-foreground">
                          (Default)
                        </span>
                      )}
                    </span>
                  </CommandItem>
                ))}
                <CommandItem
                  value="create-template"
                  onSelect={handleSelect}
                  className="text-xs border-t-[1px] border-border pt-2 mt-2"
                >
                  Create template
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Enter a name for your new invoice template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Standard Invoice"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateTemplate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setTemplateName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={
                !templateName.trim() || createTemplateMutation.isPending
              }
            >
              {createTemplateMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
