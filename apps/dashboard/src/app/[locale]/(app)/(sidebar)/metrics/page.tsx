import { redirect } from "next/navigation";

export default function MetricsPage() {
  redirect("/?tab=metrics");
}
