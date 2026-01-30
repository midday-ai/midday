"use client";

import { useTRPC } from "@/trpc/client";
import { DropdownMenuCheckboxItem } from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useFormContext } from "react-hook-form";

type RequirementItemProps = {
  label: string;
  linkHref: string;
  linkText?: string;
};

function RequirementItem({ label, linkHref, linkText }: RequirementItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-2 py-1.5">
      <div className="flex items-center gap-2">
        <Icons.Close className="size-3.5 text-destructive" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <Link href={linkHref} className="text-xs text-primary hover:underline">
        {linkText ?? "Setup"}
      </Link>
    </div>
  );
}

type EInvoiceRequirementsProps = {
  templateId: string;
};

export function EInvoiceRequirements({
  templateId,
}: EInvoiceRequirementsProps) {
  const { watch, setValue } = useFormContext();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const customerId = watch("customerId");
  const eInvoiceEnabled = watch("template.eInvoiceEnabled") === true;
  const eInvoiceNotifyEmail = watch("template.eInvoiceNotifyEmail") === true;

  // Fetch e-invoice requirements
  const { data: requirements, isLoading } = useQuery({
    ...trpc.invoice.checkEInvoiceRequirements.queryOptions({
      customerId: customerId || undefined,
    }),
    staleTime: 30000, // Cache for 30 seconds
  });

  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceTemplate.list.queryKey(),
        });
      },
    }),
  );

  const handleEnableChange = (checked: boolean) => {
    const previousValue = eInvoiceEnabled;
    setValue("template.eInvoiceEnabled", checked, {
      shouldValidate: true,
      shouldDirty: true,
    });
    updateTemplateMutation.mutate(
      {
        id: templateId,
        eInvoiceEnabled: checked,
      },
      {
        onError: () => {
          // Revert form state on failure
          setValue("template.eInvoiceEnabled", previousValue, {
            shouldValidate: true,
            shouldDirty: true,
          });
        },
      },
    );
  };

  const handleNotifyEmailChange = (checked: boolean) => {
    const previousValue = eInvoiceNotifyEmail;
    setValue("template.eInvoiceNotifyEmail", checked, {
      shouldValidate: true,
      shouldDirty: true,
    });
    updateTemplateMutation.mutate(
      {
        id: templateId,
        eInvoiceNotifyEmail: checked,
      },
      {
        onError: () => {
          // Revert form state on failure
          setValue("template.eInvoiceNotifyEmail", previousValue, {
            shouldValidate: true,
            shouldDirty: true,
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="px-2 py-3 text-xs text-muted-foreground">
        Checking requirements...
      </div>
    );
  }

  const company = requirements?.company;
  const customer = requirements?.customer;
  const canEnable = requirements?.canEnable ?? false;

  // If company requirements aren't met, show what's missing
  if (!canEnable) {
    const missing: { label: string; linkHref: string }[] = [];

    if (!company?.hasAddress) {
      missing.push({ label: "Company address", linkHref: "/settings/company" });
    }
    if (!company?.hasCountry) {
      missing.push({ label: "Country", linkHref: "/settings/company" });
    }
    if (!company?.hasTaxId) {
      missing.push({
        label: "Tax ID / VAT number",
        linkHref: "/settings/company",
      });
    }

    return (
      <div className="w-56">
        <div className="px-2 py-1.5">
          <span className="text-xs text-muted-foreground">
            Complete setup to enable
          </span>
        </div>
        {missing.map((item) => (
          <RequirementItem
            key={item.label}
            label={item.label}
            linkHref={item.linkHref}
          />
        ))}
      </div>
    );
  }

  // Check if customer is missing Peppol ID (only when e-invoicing is enabled)
  const customerMissingPeppol =
    eInvoiceEnabled && customer && !customer.hasPeppolId;

  // Company requirements met - show settings
  return (
    <div className="w-56">
      <DropdownMenuCheckboxItem
        className="text-xs"
        checked={eInvoiceEnabled}
        onCheckedChange={handleEnableChange}
        onSelect={(event) => event.preventDefault()}
      >
        Enable e-invoicing
      </DropdownMenuCheckboxItem>

      <DropdownMenuCheckboxItem
        className="text-xs"
        checked={eInvoiceNotifyEmail}
        disabled={!eInvoiceEnabled}
        onCheckedChange={handleNotifyEmailChange}
        onSelect={(event) => event.preventDefault()}
      >
        Send notification email
      </DropdownMenuCheckboxItem>

      {customerMissingPeppol && (
        <div className="px-2 py-1.5 mt-1 text-xs text-muted-foreground">
          Customer needs Peppol ID to receive e-invoices
        </div>
      )}
    </div>
  );
}
