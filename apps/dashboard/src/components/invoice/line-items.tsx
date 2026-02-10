"use client";

import { calculateLineItemTotal } from "@midday/invoice/calculate";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Reorder, useDragControls } from "framer-motion";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTemplateUpdate } from "@/hooks/use-template-update";
import { formatAmount } from "@/utils/format";
import type { InvoiceFormValues } from "./form-context";
import { LabelInput } from "./label-input";
import { PercentInput } from "./percent-input";
import { ProductAutocomplete } from "./product-autocomplete";
import { ProductAwareAmountInput } from "./product-aware-amount-input";
import { ProductAwareUnitInput } from "./product-aware-unit-input";
import { QuantityInput } from "./quantity-input";

export function LineItems() {
  const { control } = useFormContext();
  const currency = useWatch({ control, name: "template.currency" });
  const { updateTemplate } = useTemplateUpdate();

  const includeDecimals = useWatch({
    control,
    name: "template.includeDecimals",
  });

  const includeUnits = useWatch({
    control,
    name: "template.includeUnits",
  });

  const includeLineItemTax = useWatch({
    control,
    name: "template.includeLineItemTax",
  });

  const maximumFractionDigits = includeDecimals ? 2 : 0;

  // Build grid columns based on settings
  const getGridCols = () => {
    if (includeLineItemTax && includeUnits) {
      return "grid-cols-[1.5fr_12%_20%_12%_15%]";
    }
    if (includeLineItemTax) {
      return "grid-cols-[1.5fr_12%_12%_12%_15%]";
    }
    if (includeUnits) {
      return "grid-cols-[1.5fr_15%_25%_15%]";
    }
    return "grid-cols-[1.5fr_15%_15%_15%]";
  };

  const gridCols = getGridCols();

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
      <div className={`grid ${gridCols} gap-4 items-end mb-2`}>
        <LabelInput
          name="template.descriptionLabel"
          onSave={(value) => {
            updateTemplate({ descriptionLabel: value });
          }}
          className="truncate"
        />

        <LabelInput
          name="template.quantityLabel"
          onSave={(value) => {
            updateTemplate({ quantityLabel: value });
          }}
          className="truncate"
        />

        <LabelInput
          name="template.priceLabel"
          onSave={(value) => {
            updateTemplate({ priceLabel: value });
          }}
          className="truncate"
        />

        {includeLineItemTax && (
          <LabelInput
            name="template.lineItemTaxLabel"
            defaultValue="Tax"
            onSave={(value) => {
              updateTemplate({ lineItemTaxLabel: value });
            }}
            className="truncate"
          />
        )}

        <LabelInput
          name="template.totalLabel"
          onSave={(value) => {
            updateTemplate({ totalLabel: value });
          }}
          className="text-right truncate"
        />
      </div>

      <Reorder.Group
        axis="y"
        values={fields}
        onReorder={reorderList}
        className="!m-0"
        transition={{ duration: 0 }}
      >
        {fields.map((field, index) => (
          <LineItemRow
            key={field.id}
            // @ts-expect-error
            item={field}
            index={index}
            handleRemove={handleRemove}
            isReorderable={fields.length > 1}
            currency={currency}
            maximumFractionDigits={maximumFractionDigits}
            includeUnits={includeUnits}
            includeLineItemTax={includeLineItemTax}
            gridCols={gridCols}
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
  maximumFractionDigits,
  includeUnits,
  includeLineItemTax,
  gridCols,
}: {
  index: number;
  handleRemove: (index: number) => void;
  isReorderable: boolean;
  item: InvoiceFormValues["lineItems"][number];
  currency: string;
  maximumFractionDigits: number;
  includeUnits?: boolean;
  includeLineItemTax?: boolean;
  gridCols: string;
}) {
  const controls = useDragControls();
  const { control, watch, setValue } = useFormContext();

  const locale = useWatch({ control, name: "template.locale" });

  const price = useWatch({
    control,
    name: `lineItems.${index}.price`,
  });

  const quantity = useWatch({
    control,
    name: `lineItems.${index}.quantity`,
  });

  const lineItemName = watch(`lineItems.${index}.name`);

  return (
    <Reorder.Item
      className={`grid ${gridCols} gap-4 items-start relative group mb-2 w-full`}
      value={item}
      dragListener={false}
      dragControls={controls}
      transition={{ duration: 0 }}
      onKeyDown={(e: React.KeyboardEvent<HTMLLIElement>) => {
        // Don't interfere with arrow keys when they're used for autocomplete navigation
        if (
          e.key === "ArrowDown" ||
          e.key === "ArrowUp" ||
          e.key === "Enter" ||
          e.key === "Escape"
        ) {
          e.stopPropagation();
        }
      }}
    >
      {isReorderable && (
        <Button
          type="button"
          className="absolute -left-9 -top-[4px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-transparent cursor-grab"
          onPointerDown={(e) => controls.start(e)}
          variant="ghost"
        >
          <Icons.DragIndicator className="size-4 text-[#878787]" />
        </Button>
      )}

      <ProductAutocomplete
        index={index}
        value={lineItemName || ""}
        onChange={(value: string) => {
          setValue(`lineItems.${index}.name`, value, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }}
      />

      <QuantityInput name={`lineItems.${index}.quantity`} />

      <div className="flex items-center gap-2">
        <ProductAwareAmountInput
          name={`lineItems.${index}.price`}
          lineItemIndex={index}
        />
        {includeUnits && <span className="text-xs text-[#878787]">/</span>}
        {includeUnits && (
          <ProductAwareUnitInput
            name={`lineItems.${index}.unit`}
            lineItemIndex={index}
          />
        )}
      </div>

      {includeLineItemTax && (
        <PercentInput name={`lineItems.${index}.taxRate`} />
      )}

      <div className="text-right">
        <span className="text-xs text-primary font-mono">
          {formatAmount({
            amount: calculateLineItemTotal({
              price,
              quantity,
            }),
            currency,
            locale,
            maximumFractionDigits,
          })}
        </span>
      </div>

      {index !== 0 && (
        <Button
          type="button"
          onClick={() => handleRemove(index)}
          className="absolute -right-9 -top-[4px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-transparent text-[#878787]"
          variant="ghost"
        >
          <Icons.Close />
        </Button>
      )}
    </Reorder.Item>
  );
}
