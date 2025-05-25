import { ApiKeys } from "@/components/api-keys";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer | Midday",
};

export default async function Page() {
  return <ApiKeys />;
}
