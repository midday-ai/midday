import { getWebsiteLogo } from "@/utils/logos";
import { OgTemplate, isValidLogoUrl } from "@midday/invoice";
import { verify } from "@midday/invoice/token";
import { getInvoiceByIdQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { ImageResponse } from "next/og";

export const contentType = "image/png";

const CDN_URL = "https://cdn.midday.ai";

type Props = {
  params: { token: string };
};

export default async function Image({ params }: Props) {
  const supabase = await createClient({ admin: true });

  const { id } = await verify(params.token);
  const { data: invoice } = await getInvoiceByIdQuery(supabase, id as string);

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
      name={invoice.customer_name || (invoice.customer?.name as string)}
      invoice_number={invoice.invoice_number!}
      issue_date={invoice.issue_date!}
      due_date={invoice.due_date!}
      status={invoice.status}
      isValidLogo={isValidLogo}
      logoUrl={logoUrl}
      // @ts-expect-error - JSONB
      customer_details={invoice.customer_details}
      // @ts-expect-error - JSONB
      from_details={invoice.from_details}
      // @ts-expect-error - JSONB
      template={invoice.template}
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
