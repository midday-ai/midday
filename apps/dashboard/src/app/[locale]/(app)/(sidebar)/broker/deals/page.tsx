import { BrokerDealsPage } from "@/components/broker/broker-deals-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Deals | Abacus",
};

export default function Page() {
  return <BrokerDealsPage />;
}
