import { StartPage } from "@/components/startpage";
import type { Metadata } from "next";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Financial Overview",
  description:
    "Get real-time insight into your business's financial state. Keep track of your spending, income and overall financial health.",
};

export default async function Page() {
  return <StartPage />;
}
