"use client";

import { Editor } from "@/components/deal/editor";
import { useDealParams } from "@/hooks/use-deal-params";
import { useTemplateUpdate } from "@/hooks/use-template-update";
import { useTRPC } from "@/trpc/client";
import { transformMerchantToContent } from "@midday/deal/utils";
import { useQuery } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/react";
import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { SelectMerchant } from "../select-merchant";
import { LabelInput } from "./label-input";

export function MerchantDetails() {
  const { control, setValue, watch } = useFormContext();
  const { setParams, selectedMerchantId } = useDealParams();

  const trpc = useTRPC();
  const { updateTemplate } = useTemplateUpdate();

  const content = watch("merchantDetails");
  const id = watch("id");

  const { data: merchant } = useQuery(
    trpc.merchants.getById.queryOptions(
      { id: selectedMerchantId! },
      {
        enabled: !!selectedMerchantId,
      },
    ),
  );

  const handleLabelSave = (value: string) => {
    updateTemplate({ customerLabel: value });
  };

  const handleOnChange = (content?: JSONContent | null) => {
    // Reset the selected merchant id when the content is changed
    setParams({ selectedMerchantId: null });

    setValue("merchantDetails", content, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (!content) {
      setValue("merchantName", null, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("merchantId", null, { shouldValidate: true, shouldDirty: true });
    }
  };

  useEffect(() => {
    if (merchant) {
      const merchantContent = transformMerchantToContent(merchant);

      // Remove the selected merchant id from the url so we don't introduce a race condition
      setParams({ selectedMerchantId: null });

      setValue("merchantName", merchant.name, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("merchantId", merchant.id, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("merchantDetails", merchantContent, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [merchant]);

  return (
    <div>
      <LabelInput
        name="template.customerLabel"
        className="mb-2 block"
        onSave={handleLabelSave}
      />
      {content ? (
        <Controller
          name="merchantDetails"
          control={control}
          render={({ field }) => (
            <Editor
              // NOTE: This is a workaround to get the new content to render
              key={id}
              initialContent={field.value}
              onChange={handleOnChange}
              className="min-h-[90px]"
            />
          )}
        />
      ) : (
        <SelectMerchant />
      )}
    </div>
  );
}
