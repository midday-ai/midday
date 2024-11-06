import { CurrencyInput } from "@midday/ui/currency-input";
import { useController, useFormContext } from "react-hook-form";

export function TaxInput() {
  const { control } = useFormContext();
  const {
    field: { value, onChange },
  } = useController({
    name: "template.tax_rate",
    control,
  });

  return (
    <CurrencyInput
      suffix="%)"
      prefix="("
      autoComplete="off"
      value={value}
      onValueChange={(values) => {
        onChange(values.floatValue);
      }}
      className="p-0 border-0 h-6 text-xs !bg-transparent font-mono flex-shrink-0 w-16 text-[11px] text-[#878787]"
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
