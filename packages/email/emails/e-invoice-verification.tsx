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
  registrationUrl: string;
}

export const EInvoiceVerificationEmail = ({
  registrationUrl = "https://peppol.invopop.com/reg/abc123",
}: Props) => {
  const text = "Complete your e-invoicing verification";
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
            Complete your e-invoicing <br /> verification
          </Heading>

          <br />

          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            Your e-invoicing setup has been submitted. To activate Peppol
            e-invoicing, you need to complete a short verification to confirm
            your company identity.
            <br />
            <br />
            This typically takes a few minutes. Once submitted, verification is
            usually completed within 72 hours.
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href={registrationUrl}>Complete verification</Button>
          </Section>

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default EInvoiceVerificationEmail;
