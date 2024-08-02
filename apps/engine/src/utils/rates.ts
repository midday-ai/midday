import { uniqueCurrencies } from "@midday/location/src/currencies";

const ENDPOINT =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@2024.8.2/v1";

async function getCurrency(currency: string) {
  const response = await fetch(`${ENDPOINT}/currencies/${currency}.json`);

  return response.json();
}

function transformKeysToUppercase(obj) {
  // Convert the object into an array of [key, value] pairs
  const entries = Object.entries(obj);

  // Transform each entry's key to uppercase
  const upperCaseEntries = entries.map(([key, value]) => {
    return [key.toUpperCase(), value];
  });

  // Convert the transformed entries back into an object
  const transformedObject = Object.fromEntries(upperCaseEntries);

  return transformedObject;
}

export async function getRates() {
  const rates = await Promise.allSettled(
    uniqueCurrencies.map((currency) => getCurrency(currency.toLowerCase())),
  );

  return rates
    .filter((rate) => rate.status === "fulfilled")
    .map((rate) => rate.value)
    .map((value) => {
      const currency = Object.keys(value).at(1);

      return {
        source: currency?.toUpperCase(),
        rates: transformKeysToUppercase(value[currency]),
        // TODO: Filter currencies that are not in the list of unique currencies
      };
    });
}
