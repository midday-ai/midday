import { getUser } from "@midday/supabase/cached-queries";
import { SelectCurrency } from "./select-currency";

export async function BaseCurrencyServer() {
  const user = await getUser();

  return <SelectCurrency defaultValue={user?.data?.team?.base_currency} />;
}
