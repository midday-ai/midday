import { EditorContent } from "./editor-content";
import { LineItems } from "./line-items";
import { Logo } from "./logo";
import { Meta } from "./meta";
import { Summary } from "./summary";

const DEFAULT_LABELS = {
  customerLabel: "To",
  title: "Invoice",
  fromLabel: "From",
  invoiceNoLabel: "Invoice No",
  issueDateLabel: "Issue Date",
  dueDateLabel: "Due Date",
  descriptionLabel: "Description",
  priceLabel: "Price",
  quantityLabel: "Quantity",
  totalLabel: "Total",
  totalSummaryLabel: "Total",
  vatLabel: "VAT",
  subtotalLabel: "Subtotal",
  taxLabel: "Tax",
  discountLabel: "Discount",
  paymentLabel: "Payment Details",
  noteLabel: "Note",
  lineItemTaxLabel: "Tax",
  dateFormat: "dd/MM/yyyy",
  locale: "en-US",
  includeVat: false,
  includeTax: false,
  includeDiscount: false,
  includeLineItemTax: false,
  includeDecimals: false,
  includeUnits: false,
  taxRate: 0,
  vatRate: 0,
};

type InvoiceData = Record<string, any>;

type Props = {
  data: InvoiceData;
};

export function InvoiceTemplate({ data }: Props) {
  if (!data) return null;

  const template = { ...DEFAULT_LABELS, ...(data.template ?? {}) };
  const lineItems = data.lineItems ?? [];
  const currency = data.currency ?? null;

  const size = template.size === "letter" ? "letter" : "a4";
  const width = size === "letter" ? 750 : 595;
  const height = size === "letter" ? 1056 : 842;

  return (
    <div
      className="w-full mx-auto bg-[#fcfcfc] dark:bg-[#0f0f0f] border border-border overflow-auto text-foreground font-sans antialiased whitespace-pre-line"
      style={{ maxWidth: width }}
    >
      <div className="p-8 flex flex-col" style={{ minHeight: height - 5 }}>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 mr-5">
            <Meta
              template={template}
              invoiceNumber={data.invoiceNumber}
              issueDate={data.issueDate}
              dueDate={data.dueDate}
            />
          </div>
          {template.logoUrl && (
            <div className="shrink-0">
              <Logo
                logo={template.logoUrl}
                customerName={data.customerName || ""}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6 mb-4">
          <div>
            <p className="text-[11px] text-[#878787] mb-2 mt-0">
              {template.fromLabel}
            </p>
            <EditorContent content={data.fromDetails} />
          </div>
          <div>
            <p className="text-[11px] text-[#878787] mb-2 mt-0">
              {template.customerLabel}
            </p>
            <EditorContent content={data.customerDetails} />
          </div>
        </div>

        <EditorContent content={data.topBlock} />

        <LineItems
          lineItems={lineItems}
          currency={currency}
          descriptionLabel={template.descriptionLabel}
          quantityLabel={template.quantityLabel}
          priceLabel={template.priceLabel}
          totalLabel={template.totalLabel}
          includeDecimals={template.includeDecimals}
          locale={template.locale}
          includeUnits={template.includeUnits}
          includeLineItemTax={template.includeLineItemTax}
          lineItemTaxLabel={template.lineItemTaxLabel}
        />

        <div className="mt-10 flex justify-end mb-8">
          <Summary
            includeVat={template.includeVat}
            includeTax={template.includeTax}
            includeLineItemTax={template.includeLineItemTax}
            taxRate={template.taxRate}
            vatRate={template.vatRate}
            currency={currency}
            vatLabel={template.vatLabel}
            taxLabel={template.taxLabel}
            totalLabel={template.totalSummaryLabel}
            lineItems={lineItems}
            includeDiscount={template.includeDiscount}
            discountLabel={template.discountLabel}
            discount={data.discount}
            locale={template.locale}
            includeDecimals={template.includeDecimals}
            subtotalLabel={template.subtotalLabel}
          />
        </div>

        <div className="flex flex-col gap-8 mt-auto">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] text-[#878787] mb-2 mt-0">
                {template.paymentLabel}
              </p>
              <EditorContent content={data.paymentDetails} />
            </div>
            {data.noteDetails && (
              <div>
                <p className="text-[11px] text-[#878787] mb-2 mt-0">
                  {template.noteLabel}
                </p>
                <EditorContent content={data.noteDetails} />
              </div>
            )}
          </div>

          <EditorContent content={data.bottomBlock} />
        </div>
      </div>
    </div>
  );
}
