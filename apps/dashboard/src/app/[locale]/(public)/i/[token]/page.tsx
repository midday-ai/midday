import CustomerHeader from "@/components/customer-header";
import InvoiceToolbar from "@/components/invoice-toolbar";
import { decrypt } from "@midday/encryption";
import { HtmlTemplate } from "@midday/invoice/templates/html";
import { verify } from "@midday/invoice/token";
import { getInvoiceByIdQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { waitUntil } from "@vercel/functions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { SearchParams } from "nuqs";

export async function generateMetadata(props: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const supabase = await createClient({ admin: true });

  try {
    const { id } = await verify(params.token);
    const { data: invoice } = await getInvoiceByIdQuery(supabase, id);

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
  params: Promise<{ token: string }>;
  searchParams: Promise<SearchParams>;
};

async function updateInvoiceViewedAt(id: string) {
  const supabase = await createClient({ admin: true });

  await supabase
    .from("invoices")
    .update({
      viewed_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export default async function Page(props: Props) {
  const params = await props.params;
  const supabase = await createClient({ admin: true });
  const searchParams = await props.searchParams;
  const viewer = decodeURIComponent(searchParams?.viewer as string);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { id } = (await verify(decodeURIComponent(params.token))) as {
    id: string;
  };

  const { data: invoice } = await getInvoiceByIdQuery(supabase, id);

  if (viewer) {
    try {
      const decryptedEmail = decrypt(viewer);

      if (decryptedEmail === invoice?.customer?.email) {
        // Only update the invoice viewed_at if the user is a viewer
        waitUntil(updateInvoiceViewedAt(id));
      }
    } catch (error) {
      console.log(error);
    }
  }

  // If the invoice is draft and the user is not logged in, return 404 or if the invoice is not found
  if (!invoice || (invoice.status === "draft" && !session)) {
    notFound();
  }

  // @ts-expect-error - template.size is not typed (JSONB)
  const width = invoice.template.size === "letter" ? 750 : 595;
  // @ts-expect-error - template.size is not typed (JSONB)
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
}
