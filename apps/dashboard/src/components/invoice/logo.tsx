"use client";

import type { InvoiceFormValues } from "@/actions/invoice/schema";
import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { useUpload } from "@/hooks/use-upload";
import { Skeleton } from "@midday/ui/skeleton";
import { useToast } from "@midday/ui/use-toast";
import { useAction } from "next-safe-action/hooks";
import { useFormContext } from "react-hook-form";

export function Logo({ teamId }: { teamId: string }) {
  const { watch, setValue } = useFormContext<InvoiceFormValues>();
  const logoUrl = watch("template.logo_url");
  const { uploadFile, isLoading } = useUpload();
  const { toast } = useToast();

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { url } = await uploadFile({
          file,
          path: [teamId, "invoice", file.name],
          bucket: "avatars",
        });

        setValue("template.logo_url", url, { shouldValidate: true });

        updateInvoiceTemplate.execute({
          logo_url: url,
        });
      } catch (error) {
        toast({
          title: "Something went wrong, please try again.",
          variant: "error",
        });
      }
    }
  };

  return (
    <div className="relative size-[78px]">
      <label htmlFor="logo-upload" className="absolute inset-0">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : logoUrl ? (
          <img
            src={logoUrl}
            alt="Invoice logo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="size-[78px] bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,background_1px,background_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,background_1px,background_5px)]" />
        )}
      </label>

      <input
        id="logo-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
        disabled={isLoading}
      />
    </div>
  );
}
