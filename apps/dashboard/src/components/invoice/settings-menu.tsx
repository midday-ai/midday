"use client";

import { useAppOAuth } from "@/hooks/use-app-oauth";
import { useTRPC } from "@/trpc/client";
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
import { useState } from "react";
import { useFormContext } from "react-hook-form";
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

const booleanOptions = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];

const menuItems = [
  {
    icon: Icons.DateFormat,
    label: "Date format",
    options: dateFormats,
    key: "dateFormat",
  },
  {
    icon: Icons.CropFree,
    label: "Invoice size",
    options: invoiceSizes,
    key: "size",
  },
  {
    icon: Icons.Tax,
    label: "Add sales tax",
    options: booleanOptions,
    key: "includeTax",
  },
  {
    icon: Icons.ListAlt,
    label: "Line item tax",
    options: booleanOptions,
    key: "includeLineItemTax",
  },
  {
    icon: Icons.Vat,
    label: "Add VAT",
    options: booleanOptions,
    key: "includeVat",
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
    icon: Icons.ConfirmationNumber,
    label: "Add discount",
    options: booleanOptions,
    key: "includeDiscount",
  },
  {
    icon: Icons.AttachEmail,
    label: "Attach PDF in email",
    options: booleanOptions,
    key: "includePdf",
  },
  {
    icon: Icons.OutgoingMail,
    label: "Send copy (BCC)",
    options: booleanOptions,
    key: "sendCopy",
  },
  {
    icon: Icons.Straighten,
    label: "Add units",
    options: booleanOptions,
    key: "includeUnits",
  },
  {
    icon: Icons.Decimals,
    label: "Decimals",
    options: booleanOptions,
    key: "includeDecimals",
  },
  {
    icon: Icons.QrCode,
    label: "Add QR code",
    options: booleanOptions,
    key: "includeQr",
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

  const templateId = watch("template.id");
  const templateName = watch("template.name");
  const isDefault = watch("template.isDefault");
  const paymentEnabled = watch("template.paymentEnabled");

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
          {menuItems.map((item, index) => {
            const watchKey = `template.${item.key}`;

            if (item.key === "currency") {
              return (
                <DropdownMenuSub key={index.toString()}>
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
              <DropdownMenuSub key={index.toString()}>
                <DropdownMenuSubTrigger>
                  <item.icon className="mr-2 size-4" />
                  <span className="text-xs">{item.label}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="p-0 max-h-48 overflow-y-auto">
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

          {/* Accept Payments Section */}
          <DropdownMenuSeparator />

          {stripeStatus?.connected ? (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Icons.Tax className="mr-2 size-4" />
                  <span className="text-xs">Accept payments</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="p-0">
                  {booleanOptions.map((option, optionIndex) => (
                    <DropdownMenuCheckboxItem
                      key={optionIndex.toString()}
                      className="text-xs"
                      checked={paymentEnabled === option.value}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setValue("template.paymentEnabled", option.value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          updateTemplateMutation.mutate({
                            id: templateId,
                            paymentEnabled: option.value,
                          });
                        }
                      }}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDisconnectDialogOpen(true)}
                    className="text-xs cursor-pointer text-destructive focus:text-destructive"
                  >
                    Disconnect Stripe
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          ) : (
            <DropdownMenuItem
              onClick={() => stripeOAuth.connect()}
              className="text-xs cursor-pointer"
              disabled={stripeOAuth.isLoading}
            >
              <Icons.Tax className="mr-2 size-4" />
              {stripeOAuth.isLoading ? "Connecting..." : "Connect Stripe"}
            </DropdownMenuItem>
          )}

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
