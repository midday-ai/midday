import { TrackerGraph } from "@/components/tracker-graph";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tracker | Midday",
};

export default function Tracker() {
  return <TrackerGraph />;
}
