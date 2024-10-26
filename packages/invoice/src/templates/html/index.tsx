import { ScrollArea } from "@midday/ui/scroll-area";
import type { TemplateProps } from "../types";
import { CustomerDetails } from "./components/customer-details";
import { EditorContent } from "./components/editor-content";
import { FromDetails } from "./components/from-details";
import { LineItems } from "./components/line-items";
import { Logo } from "./components/logo";
import { Meta } from "./components/meta";

export function HtmlTemplate({
  invoice_number,
  issue_date,
  due_date,
  template,
  line_items,
  customer_details,
  from_details,
  payment_details,
  note_details,
  currency,
  customer_name,
  vat,
  tax,
  amount,
  size = "a4",
}: TemplateProps) {
  const width = size === "letter" ? 816 : 595;
  const height = size === "letter" ? 1056 : 842;

  return (
    <ScrollArea
      className="bg-background border border-border shadow-2xl"
      style={{ width, height }}
      hideScrollbar
    >
      <div className="p-8 h-full flex flex-col">
        <div className="flex flex-col">
          {template.logo_url && (
            <Logo logo={template.logo_url} customerName={customer_name || ""} />
          )}
        </div>

        <div className="mt-8">
          <Meta
            template={template}
            invoiceNumber={invoice_number}
            issueDate={issue_date}
            dueDate={due_date}
          />
        </div>

        <div className="grid grid-cols-2 gap-6 mt-8">
          <div>
            <p className="text-[11px] text-[#878787] font-mono mb-2 block">
              {template.from_label}
            </p>
            <EditorContent content={from_details} />
          </div>
          <div>
            <p className="text-[11px] text-[#878787] font-mono mb-2 block">
              {template.customer_label}
            </p>
            <EditorContent content={customer_details} />
          </div>
        </div>

        <div className="mt-8">
          <LineItems
            lineItems={line_items}
            currency={currency}
            descriptionLabel={template.description_label}
          />
        </div>
      </div>
    </ScrollArea>
  );
}
