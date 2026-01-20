import { LoginContent } from "@/components/login-content";
import { Cookies } from "@/utils/constants";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { userAgent } from "next/server";

export const metadata: Metadata = {
  title: "Login | Midday",
};

export default async function Page() {
  const cookieStore = await cookies();
  const preferred = cookieStore.get(Cookies.PreferredSignInProvider);
  const { device } = userAgent({ headers: await headers() });

  return (
    <LoginContent
      preferredProvider={preferred?.value}
      isAppleDevice={device?.vendor === "Apple"}
    />
  );
}
