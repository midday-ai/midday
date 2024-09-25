import { Apps } from "@/components/apps";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apps | Midday",
};

export default async function Page() {
  return <Apps />;
}
