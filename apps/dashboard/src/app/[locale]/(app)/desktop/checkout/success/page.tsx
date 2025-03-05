import { CheckoutSuccessDesktop } from "@/components/checkout-success-desktop";

export default function Page({
  searchParams,
}: {
  searchParams: { redirectPath: string };
}) {
  return <CheckoutSuccessDesktop redirectPath={searchParams.redirectPath} />;
}
