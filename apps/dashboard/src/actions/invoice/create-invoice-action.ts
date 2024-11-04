"use server";

import { authActionClient } from "@/actions/safe-action";
import { resend } from "@/utils/resend";
import { UTCDate } from "@date-fns/utc";
import InvoiceEmail from "@midday/email/emails/invoice";
import { getAppUrl } from "@midday/utils/envs";
import { render } from "@react-email/render";
import { tasks } from "@trigger.dev/sdk/v3";
import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";
import { type InvoiceTemplate, createInvoiceSchema } from "./schema";

export const createInvoiceAction = authActionClient
  .metadata({
    name: "create-invoice",
  })
  .schema(createInvoiceSchema)
  .action(async ({ parsedInput: { id }, ctx: { supabase, user } }) => {
    const teamId = user.team_id;

    const { data: draft } = await supabase
      .from("invoices")
      .select("id, customer:customer_id(name, website, email), template")
      .eq("id", id)
      .single();

    if (!draft) {
      throw new Error("Draft not found");
    }

    const deliveryType =
      (draft.template as InvoiceTemplate).delivery_type ?? "create";

    const { data } = await supabase
      .from("invoices")
      .update({
        id,
        invoice_date: new UTCDate().toISOString(),
        status: "unpaid",
        sent_to:
          deliveryType === "create_and_send" ? draft.customer.email : null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (deliveryType === "create_and_send") {
      try {
        await resend.emails.send({
          from: "Midday <middaybot@midday.ai>",
          to: draft.customer.email,
          reply_to: user.team.email,
          subject: `${user.team.name} sent you an invoice`,
          headers: {
            "X-Entity-Ref-ID": nanoid(),
          },
          html: await render(
            InvoiceEmail({
              companyName: draft.customer.name,
              teamName: user.team.name,
              link: `${getAppUrl()}/i/${data?.token}`,
            }),
          ),
        });
      } catch (error) {
        console.error(error);
      }
    }

    try {
      await tasks.trigger("generate-invoice", {
        invoiceId: data?.id,
      });
    } catch (error) {
      console.error(error);
    }

    revalidateTag(`invoice_summary_${teamId}`);
    revalidateTag(`invoices_${teamId}`);
    revalidateTag(`invoice_number_${teamId}`);

    return data;
  });
