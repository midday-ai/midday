import { TrackerMonthGraph } from "@/components/tracker-month-graph";

export function TrackerWidget() {
  return <TrackerMonthGraph date={new Date().toString()} />;
}
