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
      style={{
        width: "100%",
        maxWidth: width,
        background: "var(--bg-primary, #fff)",
        border: "1px solid var(--border-color, #e5e5e5)",
        overflow: "auto",
        color: "var(--text-primary, #0a0a0a)",
        fontFamily: "var(--font-sans)",
        WebkitFontSmoothing: "antialiased",
        whiteSpace: "pre-line",
      }}
    >
      <div
        style={{
          padding: 32,
          display: "flex",
          flexDirection: "column",
          minHeight: height - 5,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, minWidth: 0, marginRight: 20 }}>
            <Meta
              template={template}
              invoiceNumber={data.invoiceNumber}
              issueDate={data.issueDate}
              dueDate={data.dueDate}
            />
          </div>
          {template.logoUrl && (
            <div style={{ flexShrink: 0 }}>
              <Logo
                logo={template.logoUrl}
                customerName={data.customerName || ""}
              />
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginTop: 24,
            marginBottom: 16,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                color: "#878787",
                marginBottom: 8,
                marginTop: 0,
              }}
            >
              {template.fromLabel}
            </p>
            <EditorContent content={data.fromDetails} />
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                color: "#878787",
                marginBottom: 8,
                marginTop: 0,
              }}
            >
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

        <div
          style={{
            marginTop: 40,
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 32,
          }}
        >
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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
            marginTop: "auto",
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  color: "#878787",
                  marginBottom: 8,
                  marginTop: 0,
                }}
              >
                {template.paymentLabel}
              </p>
              <EditorContent content={data.paymentDetails} />
            </div>
            {data.noteDetails && (
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: "#878787",
                    marginBottom: 8,
                    marginTop: 0,
                  }}
                >
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
