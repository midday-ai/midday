import { Input } from "@midday/ui/input";
import { type ChangeEventHandler, useState } from "react";
import { VatAssistant } from "./vat-assistant";

type Props = {
  name: string;
  onChange: (value: ChangeEventHandler<HTMLInputElement>) => void;
  onSelect: (vat: number) => void;
  value?: string | null;
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
    setValue(vat.toString());
    onSelect(vat);
  };

  return (
    <div className="relative">
      <Input
        key={value}
        onChange={onChange}
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
        value={value}
        onSelect={handleOnSelect}
        isFocused={isFocused}
      />
    </div>
  );
}
