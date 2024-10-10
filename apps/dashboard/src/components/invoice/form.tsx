import { Button } from "@midday/ui/button";
import { ScrollArea } from "@midday/ui/scroll-area";
import { CustomerContent } from "./customer-content";
import { FromContent } from "./from-content";
import { LineItems } from "./line-items";
import { Logo } from "./logo";
import { Meta } from "./meta";
import { NoteContent } from "./note-content";
import { PaymentDetails } from "./payment-details";
import { Summary } from "./summary";

export function Form() {
  return (
    <div className="relative h-full antialiased">
      <ScrollArea
        className="w-[544px] h-full max-h-[770px] bg-background"
        hideScrollbar
      >
        <div className="p-6">
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

          <div className="absolute bottom-4 w-full flex flex-col space-y-8">
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
    </div>
  );
}
