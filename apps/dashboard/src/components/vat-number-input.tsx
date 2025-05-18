"use client";

import { Input } from "@midday/ui/input";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function VatNumberInput({ value, onChange, ...props }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    onChange?.(newValue);
  };

  return (
    <div className="relative">
      <Input
        placeholder="Enter VAT number"
        value={value}
        onChange={handleChange}
        autoComplete="off"
        {...props}
      />
    </div>
  );
}
