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
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "lineItems",
  });

  const setItems = (newOrder: typeof fields) => {
    newOrder.forEach((item, index) => {
      const oldIndex = fields.findIndex((field) => field.id === item.id);
      if (oldIndex !== index) {
        move(oldIndex, index);
      }
    });
  };

  const handleRemove = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="space-y-4">
      <Reorder.Group axis="y" values={fields} onReorder={setItems}>
        {fields.map((field, index) => (
          <LineItemRow
            key={field.id}
            item={field}
            index={index}
            handleRemove={handleRemove}
            isReorderable={fields.length > 1}
            showLabels={index === 0}
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
  showLabels,
}: {
  index: number;
  handleRemove: (index: number) => void;
  isReorderable: boolean;
  item: InvoiceFormValues["lineItems"][number];
  showLabels: boolean;
}) {
  const controls = useDragControls();
  const y = useMotionValue(0);

  const { register } = useFormContext();

  return (
    <Reorder.Item
      className="flex items-end relative group mb-4"
      value={item}
      id={item.name}
      style={{ y }}
      dragListener={false}
      dragControls={controls}
    >
      {isReorderable && (
        <Button
          type="button"
          className="absolute -left-9 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-transparent cursor-grab"
          onPointerDown={(e) => controls.start(e)}
          variant="ghost"
        >
          <Icons.DragIndicator className="h-4 w-4 text-[#878787]" />
        </Button>
      )}

      <div className="w-1/2 mr-4">
        {showLabels && (
          <Label className="text-[11px] text-[#878787] font-mono mb-1 block w-full">
            Name
          </Label>
        )}
        <Input {...register(`lineItems.${index}.name`)} autoFocus={index > 0} />
      </div>

      <div className="w-40 mr-4">
        {showLabels && (
          <Label className="text-[11px] text-[#878787] font-mono mb-1 block w-full">
            Price
          </Label>
        )}
        <AmountInput
          {...register(`lineItems.${index}.price`, { valueAsNumber: true })}
          min="0"
        />
      </div>

      <div className="w-24 mr-4">
        {showLabels && (
          <Label className="text-[11px] text-[#878787] font-mono mb-1 block w-full">
            Quantity
          </Label>
        )}
        <Input
          {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
          type="number"
          min="0"
        />
      </div>

      <div className="w-24">
        {showLabels && (
          <Label className="text-[11px] text-[#878787] font-mono mb-1 block w-full">
            VAT
          </Label>
        )}
        <VATInput
          {...register(`lineItems.${index}.vat`, { valueAsNumber: true })}
          min="0"
          max="100"
        />
      </div>

      {index !== 0 && (
        <Button
          type="button"
          onClick={() => handleRemove(index)}
          className="absolute -right-9 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-transparent"
          variant="ghost"
        >
          <Icons.Close />
        </Button>
      )}
    </Reorder.Item>
  );
}
