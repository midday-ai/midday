import { getBankAccountsCurrencies } from "@midday/supabase/cached-queries";
import getSymbolFromCurrency from "currency-symbol-map";
import { SelectCurrency } from "./select-currency";

type Props = {
  defaultValue?: string;
};

export async function ChartCurrency({ defaultValue }: Props) {
  const currencies = await getBankAccountsCurrencies();

  // NOTE: Only show if we have more than one currency
  if (currencies?.data.length <= 1) {
    return null;
  }

  return (
    <SelectCurrency
      defaultValue={defaultValue}
      currencies={
        currencies?.data?.map(({ currency }) => ({
          id: currency,
          label: `${currency} ${getSymbolFromCurrency(currency)}`,
        })) ?? []
      }
    />
  );
}
