import CustomerHeader from "@/components/customer-header";
import InvoiceToolbar from "@/components/invoice-toolbar";
import { InvoiceCommentsSheet } from "@/components/sheets/invoice-comments";
import { UTCDate } from "@date-fns/utc";
import { HtmlTemplate } from "@midday/invoice/templates/html";
import { verify } from "@midday/invoice/token";
import { getInvoiceQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { waitUntil } from "@vercel/functions";
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

    const title = `Invoice ${invoice.invoice_number} | ${invoice.team?.name}`;
    const description = `Invoice for ${invoice.customer?.name || "Customer"}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
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

async function updateInvoiceViewedAt(id: string) {
  const supabase = createClient({ admin: true });

  await supabase
    .from("invoices")
    .update({
      viewed_at: new UTCDate().toISOString(),
    })
    .eq("id", id);
}

export default async function Page({ params }: Props) {
  const supabase = createClient({ admin: true });

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { id } = await verify(params.token);
    const { data: invoice } = await getInvoiceQuery(supabase, id);

    // If the invoice is draft and the user is not logged in, return 404 or if the invoice is not found
    if (!invoice || (invoice.status === "draft" && !session)) {
      notFound();
    }

    if (!session) {
      waitUntil(updateInvoiceViewedAt(id));
    }

    const width = invoice.template.size === "letter" ? 750 : 595;
    const height = invoice.template.size === "letter" ? 1056 : 842;

    return (
      <div className="flex flex-col justify-center items-center min-h-screen dotted-bg p-4 sm:p-6 md:p-0">
        <div
          className="flex flex-col w-full max-w-full py-6"
          style={{ maxWidth: width }}
        >
          <CustomerHeader
            name={invoice.customer_name || invoice.customer?.name}
            website={invoice.customer?.website}
            status={invoice.status}
          />
          <div className="pb-24 md:pb-0">
            <div className="shadow-[0_24px_48px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]">
              <HtmlTemplate {...invoice} width={width} height={height} />
            </div>
          </div>
        </div>

        <InvoiceToolbar
          id={invoice.id}
          size={invoice.template.size}
          customer={invoice.customer}
          viewedAt={invoice.viewed_at}
        />

        <InvoiceCommentsSheet />

        <div className="fixed bottom-4 right-4 hidden md:block">
          <a
            href="https://midday.ai?utm_source=invoice"
            target="_blank"
            rel="noreferrer"
            className="text-[9px] text-[#878787]"
          >
            Powered by <span className="text-primary">midday</span>
          </a>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
