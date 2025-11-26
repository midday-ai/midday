import { getQueryClient, trpc } from "@/trpc/server";
import { getWebsiteLogo } from "@/utils/logos";
import { OgTemplate, isValidLogoUrl } from "@midday/invoice";
import { ImageResponse } from "next/og";

export const contentType = "image/png";

type Props = {
  params: { token: string };
};

export default async function Image({ params }: Props) {
  const queryClient = getQueryClient();

  const invoice = await queryClient.fetchQuery(
    trpc.invoice.getInvoiceByToken.queryOptions({
      token: params.token,
    }),
  );

  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  // Load Hedvig Letters Sans font from Google Fonts
  const hedvigSansFont = fetch(
    "https://fonts.gstatic.com/s/hedvigletterssans/v2/CHy_V_PfGVjobSBkihHWDT98RVp37w8jcOZH3B4jm11gRA.woff2",
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
