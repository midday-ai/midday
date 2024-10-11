"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Label } from "@midday/ui/label";
import { Reorder, useDragControls, useMotionValue } from "framer-motion";
import { useFieldArray, useFormContext } from "react-hook-form";
import { AmountInput } from "./amount-input";
import { Input } from "./input";
import type { InvoiceFormValues } from "./schema";
import { VATInput } from "./vat-input";

export function LineItems() {
  const { control } = useFormContext<InvoiceFormValues>();
  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: "lineItems",
  });

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
      <div className="flex items-end mb-2">
        <Label className="text-[11px] text-[#878787] font-mono w-1/2 mr-4">
          Name
        </Label>
        <Label className="text-[11px] text-[#878787] font-mono w-40 mr-4">
          Price
        </Label>
        <Label className="text-[11px] text-[#878787] font-mono w-24 mr-4">
          Quantity
        </Label>
        <Label className="text-[11px] text-[#878787] font-mono w-24 text-right">
          VAT
        </Label>
      </div>

      <Reorder.Group axis="y" values={fields} onReorder={reorderList}>
        {fields.map((field, index) => (
          <LineItemRow
            key={field.id}
            item={field}
            index={index}
            handleRemove={handleRemove}
            isReorderable={fields.length > 1}
          />
        ))}
      </Reorder.Group>

      <button
        type="button"
        onClick={() => append({ name: "", quantity: 0, price: 0, vat: 0 })}
        className="flex items-center space-x-2 text-xs text-[#878787] font-mono"
      >
        <Icons.Add />
        <span>Add item</span>
      </button>
    </div>
  );
}

function LineItemRow({
  index,
  handleRemove,
  isReorderable,
  item,
}: {
  index: number;
  handleRemove: (index: number) => void;
  isReorderable: boolean;
  item: InvoiceFormValues["lineItems"][number];
}) {
  const controls = useDragControls();
  const y = useMotionValue(0);

  const { register } = useFormContext();

  return (
    <Reorder.Item
      className="flex items-end relative group mb-2"
      value={item}
      style={{ y }}
      dragListener={false}
      dragControls={controls}
    >
      {isReorderable && (
        <Button
          type="button"
          className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-transparent cursor-grab"
          onPointerDown={(e) => controls.start(e)}
          variant="ghost"
        >
          <Icons.DragIndicator className="h-4 w-4 text-[#878787]" />
        </Button>
      )}

      <div className="w-1/2 mr-4">
        <Input name={`lineItems.${index}.name`} autoFocus={index > 0} />
      </div>

      <div className="w-40 mr-4">
        <AmountInput name={`lineItems.${index}.price`} min="0" />
      </div>

      <div className="w-24 mr-4">
        <Input name={`lineItems.${index}.quantity`} type="number" min="0" />
      </div>

      <div className="w-24">
        <VATInput name={`lineItems.${index}.vat`} min="0" max="100" />
      </div>

      {index !== 0 && (
        <Button
          type="button"
          onClick={() => handleRemove(index)}
          className="absolute -right-9 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-transparent text-[#878787]"
          variant="ghost"
        >
          <Icons.Close />
        </Button>
      )}
    </Reorder.Item>
  );
}
