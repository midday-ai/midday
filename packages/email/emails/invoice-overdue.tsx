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
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  return (
    <EmailThemeProvider preview={<Preview>{text}</Preview>} disableDarkMode>
      <Body
        className={`my-auto mx-auto font-sans ${themeClasses.body} disable-dark-mode`}
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
            Invoice {invoiceNumber} <br />
            is now overdue
          </Heading>

          <br />

          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            Invoice <span className="font-medium">{invoiceNumber}</span> to{" "}
            <span className="font-medium">{customerName}</span> is now overdue.
            We've checked your account but haven't found a matching transaction.
            <br />
            <br />
            Please review the invoice details page to verify if payment has been
            made through another method.
            <br />
            <br />
            If needed, you can send a payment reminder to your customer or
            update the invoice status manually if it has already been paid.
            <br />
            <br />
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

export default InvoiceOverdueEmail;
