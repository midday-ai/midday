import {
  Body,
  Container,
  Heading,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Footer } from "../components/footer";
import { Logo } from "../components/logo";
import {
  Button,
  EmailThemeProvider,
  getEmailInlineStyles,
  getEmailThemeClasses,
} from "../components/theme";

interface Props {
  invoiceNumber: string;
  link: string;
}

export const InvoicePaidEmail = ({
  invoiceNumber = "INV-0001",
  link = "https://app.midday.ai/invoices?invoiceId=40b25275-258c-48e0-9678-57324cd770a6&type=details",
}: Props) => {
  const text = `Invoice ${invoiceNumber} has been paid`;
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  return (
    <EmailThemeProvider preview={<Preview>{text}</Preview>} disableDarkMode>
      <Body
        className={`my-auto mx-auto font-sans ${themeClasses.body}`}
        style={lightStyles.body}
      >
        <Container
          className={`my-[40px] mx-auto p-[20px] max-w-[600px] ${themeClasses.container}`}
          style={{
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: lightStyles.container.borderColor,
          }}
        >
          <Logo />
          <Heading
            className={`text-[21px] font-normal text-center p-0 my-[30px] mx-0 ${themeClasses.heading}`}
            style={{ color: lightStyles.text.color }}
          >
            Invoice {invoiceNumber} <br /> has been Paid
          </Heading>

          <br />

          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            Great news! We found a matching transaction for this invoice in your
            account and have marked it accordingly.
            <br />
            <br />
            The invoice has been linked to the transaction in your records.
            Please take a moment to check that everything looks right.
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href={link}>View invoice details</Button>
          </Section>

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default InvoicePaidEmail;
