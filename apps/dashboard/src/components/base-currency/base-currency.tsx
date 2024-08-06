import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Suspense } from "react";
import { Loading } from "./base-currency.loading";
import { BaseCurrencyServer } from "./base-currency.server";

export function BaseCurrency() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Base currency</CardTitle>
        <CardDescription>
          If you have multiple currencies, you can set a base currency for your
          account to view your total balance in your preferred currency.
          Exchange rates are updated every 24 hours.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Suspense fallback={<Loading />}>
          <BaseCurrencyServer />
        </Suspense>
      </CardContent>
    </Card>
  );
}
