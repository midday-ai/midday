import { Chart } from "@/components/charts/chart";
import { getMetrics } from "@midday/supabase/cached-queries";
import { startOfMonth, startOfYear, subMonths } from "date-fns";

export async function Katt() {
  console.log({
    from: startOfYear(startOfMonth(new Date())).toDateString(),
    to: new Date().toDateString(),
  });
  const data = await getMetrics({
    from: startOfYear(startOfMonth(new Date())).toDateString(),
    to: new Date().toDateString(),
  });

  return <Chart data={data} />;
}
