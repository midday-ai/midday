import {
  type InvoiceFormValues,
  type InvoiceTemplate,
  invoiceFormSchema,
} from "@/actions/invoice/schema";
import { UTCDate } from "@date-fns/utc";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScrollArea } from "@midday/ui/scroll-area";
import { addMonths } from "date-fns";
import { FormProvider, useForm } from "react-hook-form";
import { CreateButton } from "./create-button";
import { CustomerDetails } from "./customer-details";
import { FromDetails } from "./from-details";
import { LineItems } from "./line-items";
import { Logo } from "./logo";
import { Meta } from "./meta";
import { NoteContent } from "./note-content";
import { PaymentDetails } from "./payment-details";
import { Summary } from "./summary";

type Props = {
  teamId: string;
  template: InvoiceTemplate;
};

const defaultTemplate: InvoiceTemplate = {
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
  payment_details: undefined,
  note_label: "Note",
  logo_url: undefined,
  currency: "USD",
  from_details: undefined,
};

export function Form({ teamId, template: initialTemplate }: Props) {
  const template = {
    ...defaultTemplate,
    ...initialTemplate,
  };

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      id: undefined,
      template,
      customerDetails: undefined,
      fromDetails: template.from_details,
      paymentDetails: template.payment_details,
      note: undefined,
      issueDate: new UTCDate(),
      dueDate: addMonths(new UTCDate(), 1),
      invoiceNumber: "INV-0001",
      lineItems: [{ name: undefined, quantity: 0, price: 0 }],
    },
    mode: "onChange",
  });

  const onSubmit = (data: InvoiceFormValues) => {
    // createInvoice.execute(data);
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
                <FromDetails />
              </div>
              <div>
                <CustomerDetails />
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
