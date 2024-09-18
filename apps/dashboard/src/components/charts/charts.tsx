import { BurnRateChart } from "./burn-rate-chart";
import { ExpenseChart } from "./expense-chart";
import { ProfitRevenueChart } from "./profit-revenue-chart";

export function Charts(props) {
  switch (props.type) {
    case "revenue":
    case "profit":
      return <ProfitRevenueChart {...props} />;
    case "burn_rate":
      return <BurnRateChart {...props} />;
    case "expense":
      return <ExpenseChart {...props} />;
    default:
      return null;
  }
}
