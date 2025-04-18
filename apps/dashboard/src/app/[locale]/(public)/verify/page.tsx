import { DesktopSignInVerifyCode } from "@/components/desktop-sign-in-verify-code";

export default async function Verify(props) {
  const searchParams = await props.searchParams;
  return <DesktopSignInVerifyCode code={searchParams?.code} />;
}
