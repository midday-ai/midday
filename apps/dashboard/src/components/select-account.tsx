import { createBankAccountAction } from "@/actions/create-bank-account-action";
import { createClient } from "@midday/supabase/client";
import {
  getCurrentUserTeamQuery,
  getTeamBankAccountsQuery,
} from "@midday/supabase/queries";
import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { TransactionBankAccount } from "./transaction-bank-account";

type Props = {
  placeholder: string;
  className?: string;
  value?: string;
  onChange: (value: {
    id: string;
    label: string;
    logo?: string;
    currency?: string;
  }) => void;
};

export function SelectAccount({ placeholder, onChange, value }: Props) {
  const [data, setData] = useState([]);
  const supabase = createClient();

  const createBankAccount = useAction(createBankAccountAction, {
    onSuccess: async ({ data: result }) => {
      if (result) {
        onChange(result);
        setData((prev) => [{ id: result.id, label: result.name }, ...prev]);
      }
    },
  });

  useEffect(() => {
    async function fetchData() {
      const { data: userData } = await getCurrentUserTeamQuery(supabase);
      if (userData?.team_id) {
        const repsonse = await getTeamBankAccountsQuery(supabase, {
          teamId: userData.team_id,
        });

        setData(
          repsonse.data?.map((account) => ({
            id: account.id,
            label: account.name,
            logo: account?.logo_url,
            currency: account.currency,
          })),
        );
      }
    }

    if (!data.length) {
      fetchData();
    }
  }, []);

  const selectedValue = data.find((d) => d?.id === value);

  return (
    <ComboboxDropdown
      disabled={createBankAccount.status === "executing"}
      placeholder={placeholder}
      searchPlaceholder="Select or create account"
      items={data}
      selectedItem={selectedValue}
      onSelect={(item) => {
        onChange(item);
      }}
      onCreate={(name) => createBankAccount.execute({ name })}
      renderSelectedItem={(selectedItem) => {
        return (
          <TransactionBankAccount
            name={`${selectedItem.label} ${
              selectedItem.currency ? `(${selectedItem.currency})` : ""
            }`}
            logoUrl={selectedItem.logo}
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
            name={`${item.label} ${item.currency ? `(${item.currency})` : ""}`}
            logoUrl={item.logo}
          />
        );
      }}
    />
  );
}
