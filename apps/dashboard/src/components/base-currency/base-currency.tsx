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
          If you have multiple currencies, you can set the base currency for
          your account. This will be used for financial insights so you can see
          your total balance in the currency you want to. We update the rate
          every 24 hours.
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
