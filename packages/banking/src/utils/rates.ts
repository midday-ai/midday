import { uniqueCurrencies } from "@midday/location/currencies";

const ENDPOINT =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1";

async function getCurrency(currency: string) {
  const response = await fetch(`${ENDPOINT}/currencies/${currency}.json`);

  return response.json();
}

function transformKeysToUppercase(
  obj: Record<string, number>,
): Record<string, number> {
  const entries = Object.entries(obj);

  const upperCaseEntries = entries
    .map(([key, value]) => [key.toUpperCase(), value] as [string, number])
    .filter(([key]) => uniqueCurrencies.includes(key));

  return Object.fromEntries(upperCaseEntries) as Record<string, number>;
}

export async function getRates() {
  const rates = await Promise.allSettled(
    uniqueCurrencies.map((currency) => getCurrency(currency.toLowerCase())),
  );

  return rates
    .filter(
      (rate): rate is PromiseFulfilledResult<Record<string, unknown>> =>
        rate.status === "fulfilled",
    )
    .map((rate) => rate.value)
    .map((value) => {
      const date = Object.values(value).at(0);
      const currency = Object.keys(value).at(1);

      if (!currency || typeof date !== "string") {
        return null;
      }

      const currencyData = value[currency];
      if (typeof currencyData !== "object" || currencyData === null) {
        return null;
      }

      return {
        source: currency.toUpperCase(),
        date,
        rates: transformKeysToUppercase(currencyData as Record<string, number>),
      };
    })
    .filter((item) => item !== null);
}
