import { getQueryClient, trpc } from "@/trpc/server";
import { getWebsiteLogo } from "@/utils/logos";
import { OgTemplate, isValidLogoUrl } from "@midday/deal";
import { ImageResponse } from "next/og";

export const contentType = "image/png";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function Image({ params }: Props) {
  const { token } = await params;
  const queryClient = getQueryClient();

  const deal = await queryClient.fetchQuery(
    trpc.deal.getDealByToken.queryOptions({
      token,
    }),
  );

  if (!deal) {
    return new Response("Not found", { status: 404 });
  }

  const hedvigSansFont = fetch(
    "https://cdn.midday.ai/fonts/HedvigSans/HedvigLettersSans-Regular.ttf",
  ).then((res) => res.arrayBuffer());

  const logoUrl = getWebsiteLogo(deal.merchant?.website);

  const isValidLogo = await isValidLogoUrl(logoUrl);

  return new ImageResponse(
    <OgTemplate data={deal} isValidLogo={isValidLogo} />,
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
