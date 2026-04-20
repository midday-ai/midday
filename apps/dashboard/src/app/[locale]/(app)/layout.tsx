import { createClient } from "@midday/supabase/server";
import { redirect } from "next/navigation";
import { isBlockedNewUser } from "@/utils/new-user-gate";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (authUser && isBlockedNewUser(authUser.created_at)) {
    await supabase.auth.signOut();
    redirect("/login?waitlist=1");
  }

  return children;
}
