import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { Input } from "./input";

export function CurrencyInput({
  thousandSeparator = true,
  ...props
}: NumericFormatProps) {
  return (
    <NumericFormat
      thousandSeparator
      allowNegative={false}
      customInput={Input}
      {...props}
    />
  );
}
