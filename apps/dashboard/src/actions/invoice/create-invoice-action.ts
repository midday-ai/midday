"use server";

import { authActionClient } from "@/actions/safe-action";
import { resend } from "@/utils/resend";
import { UTCDate } from "@date-fns/utc";
import InvoiceEmail from "@midday/email/emails/invoice";
import { render } from "@react-email/render";
import { revalidateTag } from "next/cache";
import { createInvoiceSchema } from "./schema";

export const createInvoiceAction = authActionClient
  .metadata({
    name: "create-invoice",
  })
  .schema(createInvoiceSchema)
  .action(
    async ({
      parsedInput: { id, customer_id, type },
      ctx: { supabase, user },
    }) => {
      const teamId = user.team_id;

      const { data: customer } = await supabase
        .from("customers")
        .select("id, email, name")
        .eq("id", customer_id)
        .single();

      if (!customer) {
        throw new Error("Customer not found");
      }

      const { data } = await supabase
        .from("invoices")
        .update({
          id,
          invoice_date: new UTCDate().toISOString(),
          status: "unpaid",
          sent_to: type === "create_and_send" ? customer.email : null,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (type === "create_and_send") {
        try {
          await resend.emails.send({
            from: "Midday <middaybot@midday.ai>",
            to: customer.email,
            subject: `${user.team.name} sent you an invoice`,
            html: await render(
              InvoiceEmail({
                companyName: customer.name,
                teamName: user.team.name,
                link: `https://app.midday.ai/i/${data?.id}`,
              }),
            ),
          });
        } catch (error) {
          console.error(error);
        }
      }

      revalidateTag(`invoice_summary_${teamId}`);
      revalidateTag(`invoices_${teamId}`);
      revalidateTag(`invoice_number_${teamId}`);

      return data;
    },
  );
