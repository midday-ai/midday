import { cn } from "@midday/ui/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@midday/ui/select";

type Props = {
  value?: string;
  className?: string;
  currencies: string[];
  onChange: (value: string) => void;
};

export function SelectCurrency({
  currencies,
  value,
  onChange,
  className,
}: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-[90px] font-medium", className)}>
        {value}
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => {
          return (
            <SelectItem key={currency} value={currency}>
              {currency}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
