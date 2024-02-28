"use client";

import { createClient } from "@midday/supabase/client";
import { getTransactionsQuery } from "@midday/supabase/queries";
import { Combobox } from "@midday/ui/combobox";
import { Icons } from "@midday/ui/icons";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useDebounce } from "usehooks-ts";
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
  const [isFetching, setFetching] = useState(false);
  const [isHidden, setHidden] = useState(true);
  const [value, setValue] = useState<string>("");
  const debouncedValue = useDebounce<string>(value, 200);

  const handleOnSelect = ({ id }) => {
    setValue(items.find((item) => item.id === id)?.name);

    onSelect({
      id: inboxId,
      transaction_id: id,
      read: true,
    });
  };

  const handleOnRemove = () => {
    setValue("");

    onSelect({
      id: inboxId,
      transaction_id: null,
    });
  };

  const handleChange = (query) => {
    setValue(query);

    if (query.length > 0) {
      setFetching(true);
    } else {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (selectedTransaction) {
      setValue(selectedTransaction?.name);
    }
  }, [selectedTransaction]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await getTransactionsQuery(supabase, {
          teamId,
          to: 25,
          from: 0,
          search: {
            query: debouncedValue,
            fuzzy: true,
          },
        });

        setFetching(false);

        setItems(data);
      } catch {
        setFetching(false);
      }
    }

    if (debouncedValue.length > 0) {
      fetchData();
    }
  }, [debouncedValue]);

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

  return (
    <div className="flex items-center w-full relative">
      <Icons.Search className="w-[22px] h-[22px] absolute left-4" />
      <Combobox
        key={selectedTransaction?.id}
        hidden={isHidden}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent px-12 placeholder:text-muted-foreground dark:placeholder:text-foreground"
        classNameList="bottom-[44px]"
        value={value}
        defaultValue={selectedTransaction?.name}
        onValueChange={handleChange}
        onSelect={handleOnSelect}
        options={options}
        isFetching={isFetching}
      />
      {!isFetching && selectedTransaction && (
        <Icons.Close
          className="w-[20px] h-[20px] absolute right-4"
          onClick={handleOnRemove}
        />
      )}
    </div>
  );
}
