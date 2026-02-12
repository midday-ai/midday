"use client";

import { localDateToUTCMidnight } from "@midday/invoice/recurring";
import { uniqueCurrencies } from "@midday/location/currencies";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@midday/ui/alert-dialog";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, parseISO } from "date-fns";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useAppOAuth } from "@/hooks/use-app-oauth";
import { useTRPC } from "@/trpc/client";
import { SelectCurrency } from "../select-currency";

const dateFormats = [
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
  { value: "dd.MM.yyyy", label: "dd.MM.yyyy" },
];

const invoiceSizes = [
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
];

const paymentTermsOptions = [
  { value: 0, label: "Due on Receipt" },
  { value: 7, label: "Net 7" },
  { value: 10, label: "Net 10" },
  { value: 15, label: "Net 15" },
  { value: 30, label: "Net 30" },
  { value: 45, label: "Net 45" },
  { value: 60, label: "Net 60" },
  { value: 90, label: "Net 90" },
];

function _getPaymentTermsLabel(days: number | undefined): string {
  if (days === undefined || days === null) return "Net 30";
  const preset = paymentTermsOptions.find((opt) => opt.value === days);
  if (preset) return preset.label;
  return `${days} days`;
}

function isCustomPaymentTerms(days: number | undefined): boolean {
  if (days === undefined || days === null) return false;
  return !paymentTermsOptions.some((opt) => opt.value === days);
}

const invoiceItems = [
  {
    icon: Icons.CropFree,
    label: "Invoice size",
    options: invoiceSizes,
    key: "size",
  },
  {
    icon: Icons.CurrencyOutline,
    label: "Currency",
    options: uniqueCurrencies.map((currency) => ({
      value: currency,
      label: currency,
    })),
    key: "currency",
  },
  {
    icon: Icons.DateFormat,
    label: "Date format",
    options: dateFormats,
    key: "dateFormat",
  },
];

const taxItems = [
  { icon: Icons.Tax, label: "Sales tax", key: "includeTax" },
  { icon: Icons.Vat, label: "VAT", key: "includeVat" },
  { icon: Icons.ListAlt, label: "Line item tax", key: "includeLineItemTax" },
  { icon: Icons.ConfirmationNumber, label: "Discount", key: "includeDiscount" },
  { icon: Icons.Decimals, label: "Decimals", key: "includeDecimals" },
  { icon: Icons.Straighten, label: "Units", key: "includeUnits" },
  { icon: Icons.QrCode, label: "QR code", key: "includeQr" },
];

const emailItems = [
  {
    icon: Icons.AttachEmail,
    label: "Attach PDF",
    hint: null,
    key: "includePdf",
  },
  {
    icon: Icons.ForwardToInbox,
    label: "Send copy",
    hint: "(BCC)",
    key: "sendCopy",
  },
];

export function SettingsMenu() {
  const { watch, setValue } = useFormContext();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [customPaymentDays, setCustomPaymentDays] = useState("");

  const templateId = watch("template.id");
  const templateName = watch("template.name");
  const isDefault = watch("template.isDefault");
  const paymentEnabled = watch("template.paymentEnabled");
  const paymentTermsDays = watch("template.paymentTermsDays");

  // Stripe Connect status
  const { data: stripeStatus } = useQuery(
    trpc.invoicePayments.stripeStatus.queryOptions(),
  );

  const stripeOAuth = useAppOAuth({
    installUrlEndpoint: "/invoice-payments/connect-stripe",
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.invoicePayments.stripeStatus.queryKey(),
      });
      toast({
        title: "Stripe connected",
        description: "You can now accept payments for invoices.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to connect Stripe",
        description:
          "Please try again or contact support if the issue persists.",
        variant: "error",
      });
    },
  });

  const disconnectStripeMutation = useMutation(
    trpc.invoicePayments.disconnectStripe.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoicePayments.stripeStatus.queryKey(),
        });
        // Disable payment on the current template
        setValue("template.paymentEnabled", false, { shouldDirty: true });
        setDisconnectDialogOpen(false);
        toast({
          title: "Stripe disconnected",
          description: "Payments have been disabled.",
        });
      },
      onError: () => {
        toast({
          title: "Failed to disconnect Stripe",
          variant: "error",
        });
      },
    }),
  );

  // Get template count to prevent deleting last template
  const { data: templateCount } = useQuery(
    trpc.invoiceTemplate.count.queryOptions(),
  );

  const isLastTemplate = templateCount === 1;

  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceTemplate.list.queryKey(),
        });
      },
      onError: () => {
        toast({
          title: "Failed to update template",
          variant: "error",
        });
      },
    }),
  );

  const setDefaultMutation = useMutation(
    trpc.invoiceTemplate.setDefault.mutationOptions({
      onSuccess: () => {
        setValue("template.isDefault", true, { shouldDirty: true });
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceTemplate.list.queryKey(),
        });
      },
      onError: () => {
        toast({
          title: "Failed to set default template",
          variant: "error",
        });
      },
    }),
  );

  const deleteTemplateMutation = useMutation(
    trpc.invoiceTemplate.delete.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceTemplate.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceTemplate.count.queryKey(),
        });

        // Switch to the new default template
        if (data?.newDefault) {
          setValue("template", data.newDefault, { shouldDirty: true });
          // Sync invoice-level fields from the new template
          setValue("fromDetails", data.newDefault.fromDetails ?? null, {
            shouldDirty: true,
          });
          setValue("paymentDetails", data.newDefault.paymentDetails ?? null, {
            shouldDirty: true,
          });
          setValue("noteDetails", data.newDefault.noteDetails ?? null, {
            shouldDirty: true,
          });
        }

        setDeleteDialogOpen(false);
      },
      onError: () => {
        toast({
          title: "Failed to delete template",
          variant: "error",
        });
      },
    }),
  );

  const duplicateTemplateMutation = useMutation(
    trpc.invoiceTemplate.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceTemplate.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceTemplate.count.queryKey(),
        });

        // Switch to the duplicated template
        if (data) {
          setValue("template", data, { shouldDirty: true });
          // Sync invoice-level fields from the duplicated template
          setValue("fromDetails", data.fromDetails ?? null, {
            shouldDirty: true,
          });
          setValue("paymentDetails", data.paymentDetails ?? null, {
            shouldDirty: true,
          });
          setValue("noteDetails", data.noteDetails ?? null, {
            shouldDirty: true,
          });
        }
      },
      onError: () => {
        toast({
          title: "Failed to duplicate template",
          variant: "error",
        });
      },
    }),
  );

  const handleSetDefault = () => {
    if (templateId) {
      setDefaultMutation.mutate({ id: templateId });
    }
  };

  const handleDelete = () => {
    if (templateId) {
      deleteTemplateMutation.mutate({ id: templateId });
    }
  };

  const handleRename = () => {
    if (templateId && newName.trim()) {
      updateTemplateMutation.mutate(
        { id: templateId, name: newName.trim() },
        {
          onSuccess: () => {
            setValue("template.name", newName.trim(), { shouldDirty: true });
            setRenameDialogOpen(false);
            setNewName("");
          },
        },
      );
    }
  };

  const openRenameDialog = () => {
    setNewName(templateName || "");
    setRenameDialogOpen(true);
  };

  const handlePaymentTermsChange = (days: number) => {
    const currentPaymentTermsDays = watch("template.paymentTermsDays");
    const valueChanged = currentPaymentTermsDays !== days;

    if (valueChanged) {
      setValue("template.paymentTermsDays", days, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    // Always update due date based on issue date + payment terms
    // This ensures clicking the same option still recalculates the due date
    const issueDate = watch("issueDate");
    if (issueDate) {
      const issueDateParsed = parseISO(issueDate);
      const newDueDate = addDays(issueDateParsed, days);
      setValue("dueDate", localDateToUTCMidnight(newDueDate), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    // Only call the API if the value actually changed
    if (valueChanged) {
      updateTemplateMutation.mutate({
        id: templateId,
        paymentTermsDays: days,
      });
    }
  };

  const handleCustomPaymentTermsSubmit = () => {
    const days = Number.parseInt(customPaymentDays, 10);
    if (!Number.isNaN(days) && days >= 0 && days <= 365) {
      handlePaymentTermsChange(days);
      setCustomPaymentDays("");
    }
  };

  const handleDuplicate = () => {
    // Get the current template settings from the form
    const currentTemplate = watch("template");
    if (!currentTemplate) return;

    // Get the CURRENT invoice-level details (editors modify these, not template.*)
    // This ensures user's edits are captured, not stale template values
    const fromDetails = watch("fromDetails");
    const paymentDetails = watch("paymentDetails");
    const noteDetails = watch("noteDetails");

    // Exclude id and create with new name
    const {
      id: _id,
      isDefault: _isDefault,
      ...templateSettings
    } = currentTemplate;

    duplicateTemplateMutation.mutate({
      ...templateSettings,
      // Override with current invoice-level values to capture user's edits
      fromDetails: fromDetails ? JSON.stringify(fromDetails) : null,
      paymentDetails: paymentDetails ? JSON.stringify(paymentDetails) : null,
      noteDetails: noteDetails ? JSON.stringify(noteDetails) : null,
      name: `${templateName || "Template"} (Copy)`,
      isDefault: false,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="h-9 w-9 flex items-center justify-center border border-border hover:bg-accent transition-colors"
          >
            <Icons.Settings className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Invoice → sub-menu with size, currency, date format, payment terms */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.ReceiptLong className="mr-2 size-4" />
              <span className="text-xs">Invoice</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              {invoiceItems.map((item) => {
                const watchKey = `template.${item.key}`;

                if (item.key === "currency") {
                  return (
                    <DropdownMenuSub key={item.key}>
                      <DropdownMenuSubTrigger>
                        <item.icon className="mr-2 size-4" />
                        <span className="text-xs">{item.label}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="p-0">
                        <SelectCurrency
                          headless
                          className="text-xs"
                          currencies={uniqueCurrencies}
                          value={watch(watchKey)}
                          onChange={(value) => {
                            setValue(watchKey, value, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                            updateTemplateMutation.mutate({
                              id: templateId,
                              [item.key]: value,
                            });
                          }}
                        />
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                }

                return (
                  <DropdownMenuSub key={item.key}>
                    <DropdownMenuSubTrigger>
                      <item.icon className="mr-2 size-4" />
                      <span className="text-xs">{item.label}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="p-0">
                      {item.options.map((option, optionIndex) => (
                        <DropdownMenuCheckboxItem
                          key={optionIndex.toString()}
                          className="text-xs"
                          checked={watch(watchKey) === option.value}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setValue(watchKey, option.value, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                              updateTemplateMutation.mutate({
                                id: templateId,
                                [item.key]: option.value,
                              });
                            }
                          }}
                          onSelect={(event) => event.preventDefault()}
                        >
                          {option.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                );
              })}

              {/* Payment Terms */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Icons.CalendarMonth className="mr-2 size-4" />
                  <span className="text-xs">Payment terms</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  className="p-0 max-h-[300px] overflow-y-auto"
                  sideOffset={2}
                  alignOffset={-5}
                  collisionPadding={8}
                >
                  {paymentTermsOptions.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      className="text-xs"
                      checked={paymentTermsDays === option.value}
                      onSelect={(event) => {
                        event.preventDefault();
                        handlePaymentTermsChange(option.value);
                      }}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-xs">
                      {isCustomPaymentTerms(paymentTermsDays)
                        ? `Custom (${paymentTermsDays} days)`
                        : "Custom"}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="p-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={365}
                          value={customPaymentDays}
                          onChange={(e) => setCustomPaymentDays(e.target.value)}
                          placeholder={String(paymentTermsDays ?? 30)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleCustomPaymentTermsSubmit();
                            }
                            e.stopPropagation();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 h-7 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">
                          days
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={handleCustomPaymentTermsSubmit}
                          disabled={
                            !customPaymentDays ||
                            Number.isNaN(Number.parseInt(customPaymentDays, 10))
                          }
                        >
                          Set
                        </Button>
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Tax & Pricing → sub-menu with direct toggles */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Tax className="mr-2 size-4" />
              <span className="text-xs">Tax & Pricing</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              {taxItems.map((item) => {
                const watchKey = `template.${item.key}`;
                const isChecked = watch(watchKey) === true;
                return (
                  <DropdownMenuCheckboxItem
                    key={item.key}
                    className="text-xs"
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      setValue(watchKey, checked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      updateTemplateMutation.mutate({
                        id: templateId,
                        [item.key]: checked,
                      });
                    }}
                    onSelect={(event) => event.preventDefault()}
                  >
                    <item.icon className="mr-2 size-4" />
                    {item.label}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Email → sub-menu with direct toggles */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Email className="mr-2 size-4" />
              <span className="text-xs">Email</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              {emailItems.map((item) => {
                const watchKey = `template.${item.key}`;
                const isChecked = watch(watchKey) === true;
                return (
                  <DropdownMenuCheckboxItem
                    key={item.key}
                    className="text-xs"
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      setValue(watchKey, checked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      updateTemplateMutation.mutate({
                        id: templateId,
                        [item.key]: checked,
                      });
                    }}
                    onSelect={(event) => event.preventDefault()}
                  >
                    <item.icon className="mr-2 size-4 shrink-0" />
                    <span className="whitespace-nowrap">
                      {item.label}
                      {item.hint && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {item.hint}
                        </span>
                      )}
                    </span>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Payments → sub-menu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.CurrencyOutline className="mr-2 size-4" />
              <span className="text-xs">Payments</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              {stripeStatus?.connected ? (
                <>
                  <DropdownMenuCheckboxItem
                    className="text-xs"
                    checked={paymentEnabled === true}
                    onCheckedChange={(checked) => {
                      setValue("template.paymentEnabled", checked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      updateTemplateMutation.mutate({
                        id: templateId,
                        paymentEnabled: checked,
                      });
                    }}
                    onSelect={(event) => event.preventDefault()}
                  >
                    Accept payments
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDisconnectDialogOpen(true)}
                    className="text-xs cursor-pointer text-destructive focus:text-destructive"
                  >
                    Disconnect Stripe
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={() => stripeOAuth.connect()}
                  className="text-xs cursor-pointer"
                  disabled={stripeOAuth.isLoading}
                >
                  {stripeOAuth.isLoading ? "Connecting..." : "Connect Stripe"}
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {templateId && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={openRenameDialog}
                className="text-xs cursor-pointer"
              >
                <Icons.Edit className="mr-2 size-4" />
                Rename template
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleDuplicate}
                className="text-xs cursor-pointer"
                disabled={duplicateTemplateMutation.isPending}
              >
                <Icons.Copy className="mr-2 size-4" />
                {duplicateTemplateMutation.isPending
                  ? "Duplicating..."
                  : "Duplicate template"}
              </DropdownMenuItem>

              {!isDefault && (
                <DropdownMenuItem
                  onClick={handleSetDefault}
                  className="text-xs cursor-pointer"
                  disabled={setDefaultMutation.isPending}
                >
                  <Icons.Check className="mr-2 size-4" />
                  Set as default
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-xs cursor-pointer text-destructive focus:text-destructive"
                disabled={isLastTemplate}
              >
                <Icons.Delete className="mr-2 size-4" />
                Delete template
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateName}"? This action
              cannot be undone. Existing invoices using this template will not
              be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTemplateMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="max-w-[400px]">
          <div className="p-4">
            <DialogHeader>
              <DialogTitle>Rename Template</DialogTitle>
              <DialogDescription>
                Enter a new name for this template.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Template name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newName.trim()) {
                    handleRename();
                  }
                }}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRenameDialogOpen(false)}
                >
                  Cancel
                </Button>
                <SubmitButton
                  isSubmitting={updateTemplateMutation.isPending}
                  onClick={handleRename}
                  disabled={!newName.trim() || updateTemplateMutation.isPending}
                >
                  Save
                </SubmitButton>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Stripe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect your Stripe account? Online
              payments will be disabled for all invoices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnectStripeMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectStripeMutation.isPending
                ? "Disconnecting..."
                : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
