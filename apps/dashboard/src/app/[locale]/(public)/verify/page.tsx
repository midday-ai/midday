import { DesktopSignInVerifyCode } from "@/components/desktop-sign-in-verify-code";

type Props = {
  searchParams: Promise<{ code: string }>;
};

export default async function Verify(props: Props) {
  const searchParams = await props.searchParams;

  return <DesktopSignInVerifyCode code={searchParams?.code} />;
}
