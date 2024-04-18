import { BurnRateChart } from "./burn-rate-chart";
import { ProfitRevenueChart } from "./profit-revenue-chart";

export function Charts(props) {
  switch (props.type) {
    case "revenue":
    case "profit":
      return <ProfitRevenueChart {...props} />;
    case "burn-rate":
      return <BurnRateChart {...props} />;
    default:
      return null;
  }
}
