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

export default async function Page({ params }: { params: { token: string } }) {
  const supabase = createClient({ admin: true });

  try {
    const { id } = await verify(params.token);
    console.log("katt", id);
    const { data: invoice } = await getInvoiceQuery(supabase, id);

    if (!invoice) {
      notFound();
    }

    return <div>Invoice: {invoice.invoice_number}</div>;
  } catch (error) {
    notFound();
  }
}
