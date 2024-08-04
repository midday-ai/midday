"use client";

import { updateTeamAction } from "@/actions/update-team-action";
import { SelectCurrency as SelectCurrencyBase } from "@/components/select-currency";
import { uniqueCurrencies } from "@midday/location/src/currencies";
import { useAction } from "next-safe-action/hooks";

export function SelectCurrency({ defaultValue }: { defaultValue: string }) {
  const updateTeam = useAction(updateTeamAction);

  return (
    <SelectCurrencyBase
      onChange={async (currency) => {
        updateTeam.execute({
          base_currency: currency,
          revalidatePath: "/settings/accounts",
        });
      }}
      currencies={uniqueCurrencies}
      value={defaultValue}
      className="w-[200px]"
    />
  );
}
