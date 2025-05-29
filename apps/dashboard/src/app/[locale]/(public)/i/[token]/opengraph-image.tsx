import { getQueryClient, trpc } from "@/trpc/server";
import { getWebsiteLogo } from "@/utils/logos";
import { OgTemplate, isValidLogoUrl } from "@midday/invoice";
import { ImageResponse } from "next/og";

export const contentType = "image/png";

const CDN_URL = "https://cdn.midday.ai";

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

  const geistMonoRegular = fetch(
    `${CDN_URL}/fonts/GeistMono/og/GeistMono-Regular.otf`,
  ).then((res) => res.arrayBuffer());

  const geistSansRegular = fetch(
    `${CDN_URL}/fonts/Geist/og/Geist-Regular.otf`,
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
          name: "GeistMono",
          data: await geistMonoRegular,
          style: "normal",
          weight: 400,
        },
        {
          name: "GeistSans",
          data: await geistSansRegular,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
