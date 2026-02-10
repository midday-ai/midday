import { CurrencyInput } from "@midday/ui/currency-input";
import { useRef } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useTemplateUpdate } from "@/hooks/use-template-update";

export function TaxInput() {
  const { control } = useFormContext();
  const lastSavedValueRef = useRef<number | undefined>(undefined);
  const { updateTemplate } = useTemplateUpdate();

  const {
    field: { value, onChange },
  } = useController({
    name: "template.taxRate",
    control,
  });

  return (
    <CurrencyInput
      suffix="%)"
      prefix="("
      autoComplete="off"
      value={value}
      onValueChange={(values) => {
        const newValue = values.floatValue ?? 0;
        onChange(newValue);
      }}
      onBlur={() => {
        const currentValue = value ?? 0;
        // Only save if the value has actually changed
        if (currentValue !== lastSavedValueRef.current) {
          lastSavedValueRef.current = currentValue;
          updateTemplate({ taxRate: currentValue });
        }
      }}
      className="p-0 border-0 h-6 text-xs !bg-transparent flex-shrink-0 w-16 text-[11px] text-[#878787]"
      thousandSeparator={false}
      decimalScale={2}
      isAllowed={(values) => {
        const { floatValue } = values;
        return (
          floatValue === undefined || (floatValue >= 0 && floatValue <= 100)
        );
      }}
      allowNegative={false}
    />
  );
}
