import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import QRCodeUtil from "qrcode";
import type { Invoice } from "../types";
import { EditorContent } from "./components/editor-content";
import { LineItems } from "./components/line-items";
import { Meta } from "./components/meta";
import { Note } from "./components/note";
import { PaymentDetails } from "./components/payment-details";
import { QRCode } from "./components/qr-code";
import { Summary } from "./components/summary";

export async function PdfTemplate({
  invoiceNumber,
  issueDate,
  dueDate,
  template,
  lineItems,
  customerDetails,
  fromDetails,
  discount,
  paymentDetails,
  noteDetails,
  currency,
  vat,
  tax,
  amount,
  subtotal,
  topBlock,
  bottomBlock,
  token,
}: Invoice) {
  let qrCode = null;

  if (template.includeQr) {
    qrCode = await QRCodeUtil.toDataURL(`https://app.midday.ai/i/${token}`, {
      margin: 0,
      width: 40 * 3,
    });
  }

  return (
    <Document>
      <Page
        wrap
        size={template.size.toUpperCase() as "LETTER" | "A4"}
        style={{
          padding: 20,
          backgroundColor: "#fff",
          color: "#000",
          fontFamily: "Helvetica",
        }}
      >
        <View
          style={{
            marginBottom: 20,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Meta
            invoiceNoLabel={template.invoiceNoLabel}
            issueDateLabel={template.issueDateLabel}
            dueDateLabel={template.dueDateLabel}
            invoiceNo={invoiceNumber}
            issueDate={issueDate}
            dueDate={dueDate}
            timezone={template.timezone}
            dateFormat={template.dateFormat}
            title={template.title}
          />

          {template?.logoUrl && (
            <Image
              src={template.logoUrl}
              style={{
                height: 75,
                objectFit: "contain",
              }}
            />
          )}
        </View>

        <View style={{ flexDirection: "row", marginTop: 20 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 9, fontWeight: 500 }}>
                {template.fromLabel}
              </Text>
              <EditorContent content={fromDetails} />
            </View>
          </View>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 9, fontWeight: 500 }}>
                {template.customerLabel}
              </Text>
              <EditorContent content={customerDetails} />
            </View>
          </View>
        </View>

        <EditorContent content={topBlock} />

        <LineItems
          lineItems={lineItems}
          currency={currency}
          descriptionLabel={template.descriptionLabel}
          quantityLabel={template.quantityLabel}
          priceLabel={template.priceLabel}
          totalLabel={template.totalLabel}
          locale={template.locale}
          includeDecimals={template.includeDecimals}
          includeUnits={template.includeUnits}
        />

        <View
          style={{
            flex: 1,
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <Summary
            amount={amount}
            tax={tax}
            vat={vat}
            currency={currency}
            totalLabel={template.totalSummaryLabel}
            taxLabel={template.taxLabel}
            vatLabel={template.vatLabel}
            taxRate={template.taxRate}
            vatRate={template.vatRate}
            locale={template.locale}
            discount={discount}
            discountLabel={template.discountLabel}
            includeDiscount={template.includeDiscount}
            includeVAT={template.includeVat}
            includeTax={template.includeTax}
            includeDecimals={template.includeDecimals}
            subtotalLabel={template.subtotalLabel}
            subtotal={subtotal || 0}
          />

          <View style={{ flexDirection: "row", marginTop: 20 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <PaymentDetails
                content={paymentDetails}
                paymentLabel={template.paymentLabel}
              />

              {qrCode && <QRCode data={qrCode} />}
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Note content={noteDetails} noteLabel={template.noteLabel} />
            </View>
          </View>

          <EditorContent content={bottomBlock} />
        </View>
      </Page>
    </Document>
  );
}
