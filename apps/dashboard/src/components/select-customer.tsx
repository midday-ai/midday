"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@midday/ui/select";

type Props = {
  data: {
    id: string;
    name: string;
  }[];
};

export function SelectCustomer({ data }: Props) {
  const { setParams } = useCustomerParams();

  const handleOnSelect = (value: string) => {
    if (value === "add-new-customer") {
      setParams({ createCustomer: true });
    } else {
      //   setParams({ customerId: value });
    }
  };

  return (
    <Select onValueChange={handleOnSelect}>
      <SelectTrigger
        className="border-none font-mono text-[#434343] p-0 text-[11px] h-auto"
        hideIcon
      >
        <span>Select customer</span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {data.map((item) => (
            <SelectItem key={item.id} value={item.id} className="text-xs">
              {item.name}
            </SelectItem>
          ))}

          <SelectSeparator />
          <SelectItem value="add-new-customer" className="text-xs">
            Add new customer
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
