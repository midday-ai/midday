import { DesktopSignInVerifyCode } from "@/components/desktop-sign-in-verify-code";

export default async function Verify({ searchParams }) {
  return <DesktopSignInVerifyCode code={searchParams?.code} />;
}
