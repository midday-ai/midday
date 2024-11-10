import {
  Body,
  Button,
  Container,
  Font,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { Footer } from "../components/footer";
import { Logo } from "../components/logo";

interface Props {
  customerName: string;
  invoiceNumber: string;
  link: string;
}

export const InvoiceOverdueEmail = ({
  customerName = "Customer",
  invoiceNumber = "INV-0001",
  link = "https://app.midday.ai/invoices?invoiceId=40b25275-258c-48e0-9678-57324cd770a6&type=details",
}: Props) => {
  const text = `Invoice ${invoiceNumber} is now overdue`;

  return (
    <Html>
      <Tailwind>
        <head>
          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/files/geist-sans-latin-400-normal.woff2",
              format: "woff2",
            }}
            fontWeight={400}
            fontStyle="normal"
          />

          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/files/geist-sans-latin-500-normal.woff2",
              format: "woff2",
            }}
            fontWeight={500}
            fontStyle="normal"
          />
        </head>
        <Preview>{text}</Preview>

        <Body className="bg-[#fff] my-auto mx-auto font-sans">
          <Container
            className="border-transparent md:border-[#E8E7E1] my-[40px] mx-auto p-[20px] max-w-[600px]"
            style={{ borderStyle: "solid", borderWidth: 1 }}
          >
            <Logo />
            <Heading className="text-[#121212] text-[21px] font-normal text-center p-0 my-[30px] mx-0">
              Invoice {invoiceNumber} <br />
              is now overdue
            </Heading>

            <br />

            <Text className="text-[#121212]">
              Invoice <span className="font-medium">{invoiceNumber}</span> to{" "}
              <span className="font-medium">{customerName}</span> is now
              overdue. We've checked your account but haven't found a matching
              transaction.
              <br />
              <br />
              Please review the invoice details page to verify if payment has
              been made through another method.
              <br />
              <br />
              If needed, you can send a payment reminder to your customer or
              update the invoice status manually if it has already been paid.
              <br />
              <br />
            </Text>

            <Section className="text-center mt-[50px] mb-[50px]">
              <Button
                className="bg-transparent text-primary text-[14px] text-[#121212] font-medium no-underline text-center px-6 py-3 border border-solid border-[#121212]"
                href={link}
              >
                View invoice details
              </Button>
            </Section>

            <br />

            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InvoiceOverdueEmail;
