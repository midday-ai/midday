import { createClient } from "@midday/supabase/client";
import { getTransactionsQuery } from "@midday/supabase/queries";
import { Combobox } from "@midday/ui/combobox";
import { format } from "date-fns";
import { useState } from "react";
import { FormatAmount } from "./format-amount";

type Item = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  date: string;
};

type Props = {
  placeholder: string;
  onSelect: (item: { id: string; transaction_id?: string | null }) => void;
  inboxId: string;
  teamId: string;
  selectedTransaction?: Item;
};

export function SelectTransaction({
  placeholder,
  onSelect,
  inboxId,
  teamId,
  selectedTransaction,
}: Props) {
  const supabase = createClient();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setLoading] = useState(false);

  const handleChange = async (value: string) => {
    if (value.length > 0) {
      setLoading(true);

      try {
        const { data } = await getTransactionsQuery(supabase, {
          teamId,
          to: 25,
          from: 0,
          searchQuery: value,
        });

        setLoading(false);

        if (data) {
          setItems(data);
        }
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

  const selectedValue = selectedTransaction
    ? {
        id: selectedTransaction.id,
        name: selectedTransaction.name,
      }
    : undefined;

  return (
    <Combobox
      placeholder={placeholder}
      className="w-full border-0 bg-transparent px-12"
      classNameList="bottom-[60px]"
      onValueChange={handleChange}
      onSelect={(option) =>
        onSelect({
          id: inboxId,
          transaction_id: option?.id,
        })
      }
      onRemove={() => {
        onSelect({
          id: inboxId,
          transaction_id: null,
        });
      }}
      value={selectedValue}
      options={options}
      isLoading={isLoading}
    />
  );
}
