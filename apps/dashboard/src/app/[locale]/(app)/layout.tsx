import { redirect } from "next/navigation";
import { getSession, signOut } from "@/lib/auth";
import { isBlockedNewUser } from "@/utils/new-user-gate";
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session && isBlockedNewUser(session.user.createdAt)) {
    await signOut();
    redirect("/login?waitlist=1");
  }
  return children;
}
