import { getCountryCode } from "@midday/location";
import { currencies } from "@midday/location/src/currencies";
import { getUser } from "@midday/supabase/cached-queries";

export type Settings = {
  currency: string;
  size: string;
  include_tax: boolean;
  include_vat: boolean;
  include_discount: boolean;
  include_decimals: boolean;
  include_qr: boolean;
};

export async function getDefaultSettings(): Promise<Settings> {
  const countryCode = getCountryCode();

  const { data: userData } = await getUser();

  const currency =
    userData?.team?.base_currency ??
    currencies[countryCode as keyof typeof currencies] ??
    "USD";

  // Default to letter size for US/CA, A4 for rest of world
  const size = ["US", "CA"].includes(countryCode) ? "letter" : "a4";

  // Default to include sales tax for countries where it's common
  const include_tax = ["US", "CA", "AU", "NZ", "SG", "MY", "IN"].includes(
    countryCode,
  );

  return {
    currency,
    size,
    include_tax,
    include_vat: !include_tax,
    include_discount: false,
    include_decimals: false,
    include_qr: true,
  };
}
