import { getUserDetails } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members | Midday",
};

export default async function Members() {
  const supabase = createClient();
  const { data: userData } = await getUserDetails(supabase);

  return <div className="flex flex-col space-y-12"></div>;
}
