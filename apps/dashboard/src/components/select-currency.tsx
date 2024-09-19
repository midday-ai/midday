import { cn } from "@absplatform/ui/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@absplatform/ui/select";

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
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger className={cn("w-[90px] font-medium", className)}>
        <SelectValue placeholder="Select currency" />
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
