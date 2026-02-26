import { BrokerCommissionsPage } from "@/components/broker/broker-commissions-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Commissions | Abacus",
};

export default function Page() {
  return <BrokerCommissionsPage />;
}
