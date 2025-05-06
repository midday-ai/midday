import { Input } from "@midday/ui/input";
import { type ChangeEvent, useState } from "react";
import { VatAssistant } from "./vat-assistant";

type Props = {
  name: string;
  onChange: (value: string) => void;
  onSelect: (vat: number) => void;
  value?: number | null;
};

export function VatInput({
  name,
  onChange,
  onSelect,
  value: defaultValue,
}: Props) {
  const [isFocused, setFocused] = useState(false);
  const [value, setValue] = useState(defaultValue);

  const handleOnSelect = (vat: number) => {
    setValue(vat);
    onSelect(vat);
  };

  return (
    <div className="relative">
      <Input
        key={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        autoFocus={false}
        placeholder="VAT"
        className="remove-arrow"
        type="number"
        min={0}
        max={100}
        step={0.1}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        defaultValue={value ?? ""}
      />

      <VatAssistant
        name={name}
        value={value?.toString() ?? ""}
        onSelect={handleOnSelect}
        isFocused={isFocused}
      />
    </div>
  );
}
