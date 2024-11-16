import { UserProvider } from "@/store/user/provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <UserProvider data={null}>{children}</UserProvider>;
}
