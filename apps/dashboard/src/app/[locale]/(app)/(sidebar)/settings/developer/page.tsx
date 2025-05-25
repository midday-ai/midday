import { getQueryClient } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer | Midday",
};

export default async function Page() {
  const queryClient = getQueryClient();

  return <div>Developer</div>;
}
