"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
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
  const { setParams: setCustomerParams } = useCustomerParams();
  const { setParams: setInvoiceParams } = useInvoiceParams();

  const handleOnSelect = (value: string) => {
    if (value === "create-customer") {
      setCustomerParams({ createCustomer: true });
    } else {
      setInvoiceParams({ selectedCustomerId: value });
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
      <SelectContent className="max-h-[200px] overflow-y-auto">
        <SelectGroup>
          {data.map((item) => (
            <SelectItem key={item.id} value={item.id} className="text-xs">
              {item.name}
            </SelectItem>
          ))}

          <SelectSeparator />
          <SelectItem value="create-customer" className="text-xs">
            Create customer
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
