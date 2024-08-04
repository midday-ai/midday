import { uniqueCurrencies } from "@midday/location/src/currencies";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Suspense } from "react";
import { SelectCurrency } from "./select-currency";

export function BaseCurrency() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Base currency</CardTitle>
        <CardDescription>
          If you have multiple currencies, you can set the base currency for
          your account. This will be used for financial insights so you can see
          your total balance in the currency you want to.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Suspense>
          <SelectCurrency
            currencies={uniqueCurrencies}
            defaultCurrency={uniqueCurrencies["SEK"]}
            className="w-[200px]"
          />
        </Suspense>
      </CardContent>
    </Card>
  );
}
