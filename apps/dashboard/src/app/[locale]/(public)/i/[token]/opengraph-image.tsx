import { isValidLogoUrl, OgTemplate } from "@midday/invoice";
import { ImageResponse } from "next/og";
import { getQueryClient, trpc } from "@/trpc/server";
import { getWebsiteLogo } from "@/utils/logos";

export const contentType = "image/png";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function Image({ params }: Props) {
  const { token } = await params;
  const queryClient = getQueryClient();

  const invoice = await queryClient.fetchQuery(
    trpc.invoice.getInvoiceByToken.queryOptions({
      token,
    }),
  );

  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  const hedvigSansFont = fetch(
    "https://cdn.midday.ai/fonts/HedvigSans/HedvigLettersSans-Regular.ttf",
  ).then((res) => res.arrayBuffer());

  const logoUrl = getWebsiteLogo(invoice.customer?.website);

  const isValidLogo = await isValidLogoUrl(logoUrl);

  return new ImageResponse(
    <OgTemplate data={invoice} isValidLogo={isValidLogo} />,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "hedvig-sans",
          data: await hedvigSansFont,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
