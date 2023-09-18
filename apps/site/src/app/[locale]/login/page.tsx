import type { Metadata } from "next";
import { SignInWithOtp } from "@/components/SignInWithOtp";
import { getI18n } from "@/locales/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18n();

  return {
    title: `${t("login.title")} | Sherwood`,
  };
}

export default async function Login() {
  const t = await getI18n();

  // if (session) {
  //   redirect("/");
  // }

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <SignInWithOtp />
    </div>
  );
}
