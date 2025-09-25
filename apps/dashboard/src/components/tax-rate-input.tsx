import { CurrencyInput } from "@midday/ui/currency-input";
import { useState } from "react";
import { TaxRateAssistant } from "./tax-rate-assistant";

type Props = {
  name: string;
  onChange: (value: string) => void;
  onSelect: (vat: number) => void;
  value?: number | null;
  isNewProduct?: boolean;
};

export function TaxRateInput({
  name,
  onChange,
  onSelect,
  value: defaultValue,
  isNewProduct = true,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [userHasSetValue, setUserHasSetValue] = useState(false);

  const handleOnSelect = (vat: number) => {
    setValue(vat);
    setUserHasSetValue(true);
    onSelect(vat);
  };

  return (
    <div className="relative">
      <CurrencyInput
        suffix="%"
        autoComplete="off"
        value={value ?? ""}
        onValueChange={(values) => {
          setValue(values.floatValue);
          setUserHasSetValue(true);
          onChange(values.value);
        }}
        placeholder="Tax Rate"
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

      <TaxRateAssistant
        name={name}
        value={value?.toString() ?? ""}
        onSelect={handleOnSelect}
        userHasSetValue={userHasSetValue}
        isNewProduct={isNewProduct}
        onSuggestionReceived={(taxRate) => {
          if (!userHasSetValue) {
            setValue(taxRate);
            onChange(taxRate.toString());
          }
        }}
      />
    </div>
  );
}
