import {
  Body,
  Container,
  Heading,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Logo } from "../components/logo";
import {
  Button,
  EmailThemeProvider,
  getEmailInlineStyles,
  getEmailThemeClasses,
} from "../components/theme";

interface Props {
  customerName: string;
  teamName: string;
  invoiceNumber: string;
  link: string;
}

export const EInvoiceDeliveredEmail = ({
  customerName = "Customer",
  teamName = "Midday",
  invoiceNumber = "INV-0001",
  link = "https://app.midday.ai/i/1234567890",
}: Props) => {
  const text = `Invoice ${invoiceNumber} delivered to your Peppol inbox`;
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  return (
    <EmailThemeProvider preview={<Preview>{text}</Preview>}>
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
            Invoice {invoiceNumber} Delivered
          </Heading>

          <br />

          <span
            className={`font-medium ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Hi {customerName},
          </span>
          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            Your invoice from {teamName} has been delivered to your Peppol
            inbox. You can also view it online using the link below.
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href={link}>View invoice</Button>
          </Section>

          <Text
            className={`text-[12px] ${themeClasses.text}`}
            style={{ color: lightStyles.muted.color }}
          >
            This invoice was sent via the Peppol e-invoicing network for secure,
            compliant delivery.
          </Text>

          <br />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default EInvoiceDeliveredEmail;
