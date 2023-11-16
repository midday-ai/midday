import { createClient } from "@midday/supabase/server";
import { get } from "@vercel/edge-config";
import { VercelToolbar } from "@vercel/toolbar/next";

export async function StaffToolbar() {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const admins = await get("admins");

  const isAdmin = admins?.includes(session?.user.id);

  return isAdmin ? <VercelToolbar /> : null;
}
