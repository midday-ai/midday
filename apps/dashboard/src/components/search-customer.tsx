"use client";

import type { Customer } from "@/components/invoice/customer-details";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import { useEffect } from "react";

type Props = {
  data: Customer[];
  onSelect: (id: string) => void;
  selectedId?: string;
};

export function SearchCustomer({ data, onSelect, selectedId }: Props) {
  const { setParams: setCustomerParams } = useCustomerParams();
  const { selectedCustomerId } = useInvoiceParams();

  const formattedData = data?.map((customer) => ({
    id: customer.id,
    label: customer.name,
  }));

  const selectedItem = selectedId
    ? formattedData.find((item) => item.id === selectedId)
    : undefined;

  useEffect(() => {
    if (selectedCustomerId) {
      onSelect(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  return (
    <ComboboxDropdown
      placeholder="Select customer"
      searchPlaceholder="Search customer"
      className="text-xs"
      items={formattedData}
      onSelect={({ id }) => onSelect(id)}
      selectedItem={selectedItem}
      onCreate={(value) => {
        setCustomerParams({ createCustomer: true, name: value });
      }}
      renderListItem={(item) => {
        return (
          <div className="flex items-center justify-between w-full group">
            <span>{item.item.label}</span>
            <button
              type="button"
              onClick={() => setCustomerParams({ customerId: item.item.id })}
              className="text-xs opacity-0 group-hover:opacity-50 hover:opacity-100"
            >
              Edit
            </button>
          </div>
        );
      }}
      renderOnCreate={(value) => {
        return (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() =>
                setCustomerParams({ createCustomer: true, name: value })
              }
            >{`Create "${value}"`}</button>
          </div>
        );
      }}
    />
  );
}
