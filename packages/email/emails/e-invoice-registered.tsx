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
  peppolId?: string;
  link: string;
}

export const EInvoiceRegisteredEmail = ({
  peppolId = "0208:0316597904",
  link = "https://app.midday.ai/settings/company#e-invoicing",
}: Props) => {
  const text = "E-invoicing is now active";
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
            E-invoicing is now active
          </Heading>

          <br />

          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            Your company has been verified and registered on the Peppol network.
            Invoices will now be automatically submitted as compliant e-invoices
            when sent to customers with a Peppol ID.
            {peppolId && (
              <>
                <br />
                <br />
                Your Peppol ID: <strong>{peppolId}</strong>
              </>
            )}
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href={link}>View e-invoicing settings</Button>
          </Section>

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default EInvoiceRegisteredEmail;
