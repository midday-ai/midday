import { getWebsiteLogo } from "@/utils/logos";
import { OgTemplate, isValidLogoUrl } from "@midday/invoice";
import { verify } from "@midday/invoice/token";
import { getInvoiceByIdQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { ImageResponse } from "next/og";

export const contentType = "image/png";

const CDN_URL = "https://cdn.midday.ai";

export default async function Image({ params }: { params: { token: string } }) {
  const supabase = await createClient({ admin: true });

  const { id } = await verify(params.token);
  const { data: invoice } = await getInvoiceByIdQuery(supabase, id);

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
    <OgTemplate
      {...invoice}
      name={invoice.customer_name || invoice.customer?.name}
      isValidLogo={isValidLogo}
      logoUrl={logoUrl}
    />,
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
