import { CheckoutSuccessDesktop } from "@/components/checkout-success-desktop";

export default async function Page(
  props: {
    searchParams: Promise<{ redirectPath: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <CheckoutSuccessDesktop redirectPath={searchParams.redirectPath} />;
}
