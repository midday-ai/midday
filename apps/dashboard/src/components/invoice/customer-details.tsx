"use client";

import { Editor } from "@/components/invoice/editor";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { transformCustomerToContent } from "@midday/invoice/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/react";
import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { SelectCustomer } from "../select-customer";
import { LabelInput } from "./label-input";

export function CustomerDetails() {
  const { control, setValue, watch } = useFormContext();
  const { setParams, selectedCustomerId } = useInvoiceParams();

  const trpc = useTRPC();
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  const content = watch("customerDetails");
  const id = watch("id");

  const { data: customer } = useQuery(
    trpc.customers.getById.queryOptions(
      { id: selectedCustomerId! },
      {
        enabled: !!selectedCustomerId,
      },
    ),
  );

  const handleLabelSave = (value: string) => {
    updateTemplateMutation.mutate({ customerLabel: value });
  };

  const handleOnChange = (content?: JSONContent | null) => {
    // Reset the selected customer id when the content is changed
    setParams({ selectedCustomerId: null });

    setValue("customerDetails", content, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (!content) {
      setValue("customerName", null, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("customerId", null, { shouldValidate: true, shouldDirty: true });
    }
  };

  useEffect(() => {
    if (customer) {
      const customerContent = transformCustomerToContent(customer);

      // Remove the selected customer id from the url so we don't introduce a race condition
      setParams({ selectedCustomerId: null });

      setValue("customerName", customer.name, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("customerId", customer.id, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("customerDetails", customerContent, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [customer]);

  return (
    <div>
      <LabelInput
        name="template.customerLabel"
        className="mb-2 block"
        onSave={handleLabelSave}
      />
      {content ? (
        <Controller
          name="customerDetails"
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
        <SelectCustomer />
      )}
    </div>
  );
}
