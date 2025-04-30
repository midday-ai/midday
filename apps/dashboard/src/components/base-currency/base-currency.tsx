import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { SelectCurrency } from "./select-currency";

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
        <SelectCurrency />
      </CardContent>
    </Card>
  );
}
