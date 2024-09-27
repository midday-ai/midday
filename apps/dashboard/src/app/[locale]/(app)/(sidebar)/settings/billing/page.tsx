import config from "@/config";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Billing | ${config.company}`,
};

export default async function Billing() {
  return (
    <div className="space-y-12">
      <div>Plan</div>
      <div>Payment Method</div>
      <div>Add-Ons</div>
      <div>Billing Address</div>
    </div>
  );
}
