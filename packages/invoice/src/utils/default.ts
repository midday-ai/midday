import { getCountryCode } from "@midday/location";
import { currencies } from "@midday/location/src/currencies";

export type Settings = {
  currency: string;
  size: string;
  include_tax: boolean;
  include_vat: boolean;
};

export function getDefaultSettings(): Settings {
  const countryCode = getCountryCode();

  const currency = currencies[countryCode as keyof typeof currencies] ?? "USD";

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
  };
}
