import { zodResolver } from "@hookform/resolvers/zod";
import { ScrollArea } from "@midday/ui/scroll-area";
import { FormProvider, useForm } from "react-hook-form";
import { CreateButton } from "./create-button";
import { CustomerContent } from "./customer-content";
import { FromContent } from "./from-content";
import { LineItems } from "./line-items";
import { Logo } from "./logo";
import { Meta } from "./meta";
import { NoteContent } from "./note-content";
import { PaymentDetails } from "./payment-details";
import {
  type InvoiceFormValues,
  type InvoiceSettings,
  invoiceSchema,
} from "./schema";
import { Summary } from "./summary";

type Props = {
  teamId: string;
  settings: InvoiceSettings;
};

const defaultSettings: InvoiceSettings = {
  customer_label: "To",
  from_label: "From",
  invoice_no_label: "Invoice No",
  issue_date_label: "Issue Date",
  due_date_label: "Due Date",
  description_label: "Description",
  price_label: "Price",
  quantity_label: "Quantity",
  total_label: "Total",
  vat_label: "VAT",
  tax_label: "Tax",
  payment_details_label: "Payment Details",
  note_label: "Note",
  logo_url: undefined,
};

export function Form({ teamId, settings }: Props) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      settings: {
        ...defaultSettings,
        ...settings,
      },
      invoiceNumber: "INV-0001",
      currency: "USD",
      lineItems: [{ name: "", quantity: 0, price: 0 }],
    },
  });

  const onSubmit = (data: InvoiceFormValues) => {
    console.log(data);
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="relative h-full antialiased"
      >
        <ScrollArea
          className="w-[544px] h-full max-h-[770px] bg-background"
          hideScrollbar
        >
          <div className="p-8">
            <div className="flex flex-col">
              <Logo teamId={teamId} />
            </div>

            <div className="mt-8">
              <Meta />
            </div>

            <div className="grid grid-cols-2 gap-6 mt-8">
              <div>
                <FromContent />
              </div>
              <div>
                <CustomerContent />
              </div>
            </div>

            <div className="mt-8">
              <LineItems />
            </div>

            <div className="mt-8 flex justify-end">
              <Summary />
            </div>

            <div className="mt-8 flex" />

            <div className="flex flex-col space-y-8 mt-auto">
              <div className="grid grid-cols-2 gap-6">
                <PaymentDetails />
                <NoteContent />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-14 w-full h-9">
          <div className="flex justify-end mt-auto">
            <CreateButton />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
