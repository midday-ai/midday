"use client";

import type { InvoiceFormValues } from "@/actions/invoice/schema";
import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { formatAmount } from "@/utils/format";
import { calculateTotal } from "@midday/invoice/calculate";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Reorder, useDragControls } from "framer-motion";
import { useAction } from "next-safe-action/hooks";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { AmountInput } from "./amount-input";
import { Input } from "./input";
import { LabelInput } from "./label-input";
import { VATInput } from "./vat-input";

export function LineItems() {
  const { control } = useFormContext<InvoiceFormValues>();
  const currency = useWatch({ control, name: "template.currency" });
  const includeVAT = useWatch({ control, name: "template.include_vat" });

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: "line_items",
  });

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  const reorderList = (newFields: typeof fields) => {
    const firstDiffIndex = fields.findIndex(
      (field, index) => field.id !== newFields[index]?.id,
    );

    if (firstDiffIndex !== -1) {
      const newIndex = newFields.findIndex(
        (field) => field.id === fields[firstDiffIndex]?.id,
      );

      if (newIndex !== -1) {
        swap(firstDiffIndex, newIndex);
      }
    }
  };

  const handleRemove = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`grid ${includeVAT ? "grid-cols-[1.5fr_15%_15%_6%_15%]" : "grid-cols-[1.5fr_15%_15%_15%]"} gap-4 items-end mb-2`}
      >
        <LabelInput
          name="template.description_label"
          onSave={(value) => {
            updateInvoiceTemplate.execute({
              description_label: value,
            });
          }}
          className="truncate"
        />
        <LabelInput
          name="template.price_label"
          onSave={(value) => {
            updateInvoiceTemplate.execute({
              price_label: value,
            });
          }}
          className="truncate"
        />
        <LabelInput
          name="template.quantity_label"
          onSave={(value) => {
            updateInvoiceTemplate.execute({
              quantity_label: value,
            });
          }}
          className="truncate"
        />
        {includeVAT && (
          <LabelInput
            name="template.vat_label"
            onSave={(value) => {
              updateInvoiceTemplate.execute({
                vat_label: value,
              });
            }}
            className="truncate"
          />
        )}
        <LabelInput
          name="template.total_label"
          onSave={(value) => {
            updateInvoiceTemplate.execute({
              total_label: value,
            });
          }}
          className="text-right truncate"
        />
      </div>

      <Reorder.Group
        axis="y"
        values={fields}
        onReorder={reorderList}
        className="!m-0"
      >
        {fields.map((field, index) => (
          <LineItemRow
            key={field.id}
            item={field}
            index={index}
            handleRemove={handleRemove}
            isReorderable={fields.length > 1}
            currency={currency}
            includeVAT={includeVAT}
          />
        ))}
      </Reorder.Group>

      <button
        type="button"
        onClick={() =>
          append({
            name: "",
            quantity: 0,
            price: 0,
            vat: includeVAT ? 0 : undefined,
          })
        }
        className="flex items-center space-x-2 text-xs text-[#878787] font-mono"
      >
        <Icons.Add />
        <span className="text-[11px]">Add item</span>
      </button>
    </div>
  );
}

function LineItemRow({
  index,
  handleRemove,
  isReorderable,
  item,
  currency,
  includeVAT,
}: {
  index: number;
  handleRemove: (index: number) => void;
  isReorderable: boolean;
  item: InvoiceFormValues["line_items"][number];
  currency: string;
  includeVAT: boolean;
}) {
  const controls = useDragControls();
  const { control } = useFormContext<InvoiceFormValues>();

  const price = useWatch({
    control,
    name: `line_items.${index}.price`,
  });

  const quantity = useWatch({
    control,
    name: `line_items.${index}.quantity`,
  });

  const vat = useWatch({
    control,
    name: `line_items.${index}.vat`,
  });

  return (
    <Reorder.Item
      className={`grid ${includeVAT ? "grid-cols-[1.5fr_15%_15%_6%_15%]" : "grid-cols-[1.5fr_15%_15%_15%]"} gap-4 items-end relative group mb-2 w-full`}
      value={item}
      dragListener={false}
      dragControls={controls}
    >
      {isReorderable && (
        <Button
          type="button"
          className="absolute -left-[5%] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-transparent cursor-grab"
          onPointerDown={(e) => controls.start(e)}
          variant="ghost"
        >
          <Icons.DragIndicator className="h-4 w-4 text-[#878787]" />
        </Button>
      )}

      <Input name={`line_items.${index}.name`} autoFocus={index > 0} />

      <AmountInput name={`line_items.${index}.price`} min="0" />

      <Input name={`line_items.${index}.quantity`} type="number" min="0" />

      {includeVAT && <VATInput name={`line_items.${index}.vat`} />}

      <div className="text-right">
        <span className="text-[11px] text-primary">
          {formatAmount({
            amount: calculateTotal({
              price,
              quantity,
              vat,
              includeVAT,
            }),
            currency,
          })}
        </span>
      </div>

      {index !== 0 && (
        <Button
          type="button"
          onClick={() => handleRemove(index)}
          className="absolute -right-[4.5%] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-transparent text-[#878787]"
          variant="ghost"
        >
          <Icons.Close />
        </Button>
      )}
    </Reorder.Item>
  );
}
