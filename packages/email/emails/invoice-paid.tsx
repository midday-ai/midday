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

interface WelcomeProps {
  invoiceNumber: string;
  link: string;
}

export const InvoicePaidEmail = ({
  invoiceNumber = "INV-0001",
  link = "https://app.midday.ai/i/1234567890",
}: WelcomeProps) => {
  const text = `New comment on Invoice ${invoiceNumber}`;

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
              Invoice {invoiceNumber} <br /> has been Paid
            </Heading>

            <br />

            <Text className="text-[#121212]">
              We’ve received confirmation that your invoice has been
              successfully settled and it's automatically reconciled against
              your transaction.
            </Text>

            <Section className="text-center mt-[50px] mb-[50px]">
              <Button
                className="bg-transparent text-primary text-[14px] text-[#121212] font-medium no-underline text-center px-6 py-3 border border-solid border-[#121212]"
                href={link}
              >
                View invoice
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

export default InvoicePaidEmail;
