"use client";

import { createClient } from "@midday/supabase/client";
import { getTransactionsQuery } from "@midday/supabase/queries";
import { Combobox } from "@midday/ui/combobox";
import { format } from "date-fns";
import { useState } from "react";
import { FormatAmount } from "./format-amount";

export function SelectTransaction({
  placeholder,
  onSelect,
  inboxId,
  teamId,
  selectedTransaction,
}) {
  const supabase = createClient();
  const [items, setItems] = useState([]);
  const [isLoading, setLoading] = useState(false);

  const handleOnRemove = () => {
    onSelect({
      id: inboxId,
      transaction_id: null,
    });
  };

  const handleOnSelect = (option) => {
    onSelect({
      id: inboxId,
      transaction_id: option?.id,
    });
  };

  const handleChange = async (value: string) => {
    if (value.length > 0) {
      setLoading(true);

      try {
        const { data } = await getTransactionsQuery(supabase, {
          teamId,
          to: 25,
          from: 0,
          filter: {
            attachments: "exclude",
          },
          search: {
            query: value,
          },
        });

        setLoading(false);
        setItems(data);
      } catch {
        setLoading(false);
      }
    }
  };

  const options = items.map((item) => ({
    id: item.id,
    name: item.name,
    component: () => (
      <div className="dark:text-white flex w-full">
        <div className="w-[50%] line-clamp-1 text-ellipsis overflow-hidden pr-8">
          {item.name}
        </div>
        <div className="w-[70px]">{format(new Date(item.date), "d MMM")}</div>
        <div className="flex-1 text-right">
          <FormatAmount amount={item.amount} currency={item.currency} />
        </div>
      </div>
    ),
  }));

  const selectedValue = selectedTransaction && {
    id: selectedTransaction.id,
    name: selectedTransaction.name,
  };

  return (
    <Combobox
      placeholder={placeholder}
      className="w-full border-0 bg-transparent px-12"
      classNameList="bottom-[60px]"
      onValueChange={handleChange}
      onSelect={handleOnSelect}
      onRemove={handleOnRemove}
      value={selectedValue}
      options={options}
      isLoading={isLoading}
    />
  );
}
