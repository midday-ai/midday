import { Apps } from "@/components/apps";
import { getUser } from "@midday/supabase/cached-queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apps | Midday",
};

export default async function Page() {
  const { data } = await getUser();

  return <Apps user={data} />;
}
