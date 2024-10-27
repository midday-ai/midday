import CustomerHeader from "@/components/customer-heaader";
import InvoiceToolbar from "@/components/invoice-toolbar";
import { InvoiceCommentsSheet } from "@/components/sheets/invoice-comments";
import { HtmlTemplate } from "@midday/invoice/templates/html";
import { verify } from "@midday/invoice/token";
import { getInvoiceQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: { params: { token: string } }): Promise<Metadata> {
  const supabase = createClient({ admin: true });

  try {
    const { id } = await verify(params.token);
    const { data: invoice } = await getInvoiceQuery(supabase, id);

    if (!invoice) {
      return {
        title: "Invoice Not Found",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    return {
      title: `Invoice ${invoice.invoice_number} | ${invoice.team?.name}`,
      description: `Invoice for ${invoice.customer?.name || "Customer"}`,
      robots: {
        index: false,
        follow: false,
      },
    };
  } catch (error) {
    return {
      title: "Invalid Invoice",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

type Props = {
  params: { token: string };
};

export default async function Page({ params }: Props) {
  const supabase = createClient({ admin: true });

  try {
    const { id } = await verify(params.token);
    const { data: invoice } = await getInvoiceQuery(supabase, id);

    if (!invoice) {
      notFound();
    }

    return (
      <div className="flex flex-col justify-center items-center h-screen dotted-bg">
        <div>
          <CustomerHeader
            name={invoice.customer_name || invoice.customer?.name}
            website={invoice.customer?.website}
            status={invoice.status}
          />
          <HtmlTemplate {...invoice} />
        </div>

        <InvoiceToolbar
          id={invoice.id}
          size={invoice.template.size}
          customer={invoice.customer}
        />

        <InvoiceCommentsSheet />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
