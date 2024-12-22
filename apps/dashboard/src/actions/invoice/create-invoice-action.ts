"use server";

import { authActionClient } from "@/actions/safe-action";
import { tasks } from "@trigger.dev/sdk/v3";
import { revalidateTag } from "next/cache";
import { createInvoiceSchema } from "./schema";

export const createInvoiceAction = authActionClient
  .metadata({
    name: "create-invoice",
  })
  .schema(createInvoiceSchema)
  .action(
    async ({ parsedInput: { id, deliveryType }, ctx: { supabase, user } }) => {
      const teamId = user.team_id;

      const { data: draft } = await supabase
        .from("invoices")
        .select("id, template")
        .eq("id", id)
        .single();

      if (!draft) {
        throw new Error("Draft not found");
      }

      // Update the invoice status to unpaid
      const { data: invoice } = await supabase
        .from("invoices")
        .update({ status: "unpaid" })
        .eq("id", id)
        .select("*")
        .single();

      // Only send the email if the delivery type is create_and_send
      if (deliveryType === "create_and_send") {
        await tasks.trigger("send-invoice-email", {
          invoiceId: invoice?.id,
        });
      }

      await tasks.trigger("generate-invoice", {
        invoiceId: invoice?.id,
      });

      revalidateTag(`invoice_summary_${teamId}`);
      revalidateTag(`invoices_${teamId}`);
      revalidateTag(`invoice_number_${teamId}`);

      return invoice;
    },
  );
