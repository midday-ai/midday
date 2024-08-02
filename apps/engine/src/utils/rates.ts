import { uniqueCurrencies } from "@midday/location/src/currencies";

const ENDPOINT =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@2024.8.2/v1";

async function getCurrency(currency: string) {
  const response = await fetch(`${ENDPOINT}/currencies/${currency}.json`);
  return response.json();
}

export async function getRates() {
  console.log(uniqueCurrencies);

  const rates = await Promise.allSettled(
    uniqueCurrencies.map((currency) => getCurrency(currency.toLowerCase())),
  );

  return rates;
}
