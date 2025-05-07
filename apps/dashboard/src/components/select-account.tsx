import { useTRPC } from "@/trpc/client";
import { formatAccountName } from "@/utils/format";
import {
  ComboboxDropdown,
  type ComboboxItem,
} from "@midday/ui/combobox-dropdown";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { TransactionBankAccount } from "./transaction-bank-account";

type SelectedItem = ComboboxItem & {
  id: string;
  label: string;
  logo?: string | null;
  currency?: string | null;
  type?: string | null;
};

type Props = {
  placeholder: string;
  className?: string;
  value?: string;
  onChange: (value: SelectedItem) => void;
};

export function SelectAccount({ placeholder, onChange, value }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  const { data, isLoading } = useQuery(trpc.bankAccounts.get.queryOptions());

  const createBankAccountMutation = useMutation(
    trpc.bankAccounts.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.bankAccounts.get.queryKey(),
        });

        if (data) {
          onChange({
            id: data.id,
            label: data.name ?? "",
          });

          setSelectedItem({
            id: data.id,
            label: data.name ?? "",
          });
        }
      },
    }),
  );

  useEffect(() => {
    if (value && data) {
      const found = data.find((d) => d.id === value);

      if (found) {
        setSelectedItem({
          id: found.id,
          label: found.name ?? "",
          logo: found.connection?.logo_url,
          currency: found.currency,
        });
      }
    }
  }, [value, data]);

  if (isLoading) {
    return null;
  }

  return (
    <ComboboxDropdown
      disabled={createBankAccountMutation.isPending}
      placeholder={placeholder}
      searchPlaceholder="Select or create account"
      items={
        data?.map((d) => ({
          id: d.id,
          label: d.name ?? "",
          logo: d.connection?.logo_url,
          currency: d.currency,
        })) ?? []
      }
      selectedItem={selectedItem ?? undefined}
      onSelect={(item) => {
        onChange(item);
      }}
      onCreate={(name) => {
        createBankAccountMutation.mutate({ name, manual: true });
      }}
      renderSelectedItem={(selectedItem) => {
        return (
          <TransactionBankAccount
            name={formatAccountName({
              name: selectedItem.label,
              currency: selectedItem?.currency,
            })}
            logoUrl={selectedItem?.logo ?? undefined}
          />
        );
      }}
      renderOnCreate={(value) => {
        return (
          <div className="flex items-center space-x-2">
            <span>{`Create "${value}"`}</span>
          </div>
        );
      }}
      renderListItem={({ item }) => {
        return (
          <TransactionBankAccount
            name={formatAccountName({
              name: item.label,
              currency: item?.currency,
            })}
            logoUrl={item.logo ?? undefined}
          />
        );
      }}
    />
  );
}
