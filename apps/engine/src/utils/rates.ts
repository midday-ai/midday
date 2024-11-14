import { uniqueCurrencies } from "@midday/location/currencies";

const ENDPOINT =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1";

async function getCurrency(currency: string) {
  const response = await fetch(`${ENDPOINT}/currencies/${currency}.json`);

  return response.json();
}

function transformKeysToUppercase(obj: Record<string, number>) {
  const entries = Object.entries(obj);

  // Transform each entry's key to uppercase
  const upperCaseEntries = entries
    .map(([key, value]) => {
      return [key.toUpperCase(), value];
    })
    .filter(([key]) => uniqueCurrencies.includes(key as string));

  // Convert the transformed entries back into an object
  const transformedObject = Object.fromEntries(upperCaseEntries);

  return transformedObject;
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

      if (!currency) {
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
