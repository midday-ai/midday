import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import { ScrollArea } from "@midday/ui/scroll-area";
import { FormProvider, useForm } from "react-hook-form";
import { CustomerContent } from "./customer-content";
import { FromContent } from "./from-content";
import { LineItems } from "./line-items";
import { Logo } from "./logo";
import { Meta } from "./meta";
import { NoteContent } from "./note-content";
import { PaymentDetails } from "./payment-details";
import { type InvoiceFormValues, invoiceSchema } from "./schema";
import { Summary } from "./summary";

export function Form() {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
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
              <Logo />
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

              <Meta />
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-14 w-full h-9">
          <div className="flex justify-end mt-auto">
            <Button>Create & Send</Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
