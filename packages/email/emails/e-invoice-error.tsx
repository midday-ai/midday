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
  errorMessage?: string;
  link: string;
}

export const EInvoiceErrorEmail = ({
  errorMessage = "Verification documents were rejected.",
  link = "https://app.midday.ai/settings/company#e-invoicing",
}: Props) => {
  const text = "Your e-invoicing setup needs attention";
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
            E-invoicing setup <br /> needs attention
          </Heading>

          <br />

          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            There was an issue with your e-invoicing setup. Please review the
            details and try again.
            {errorMessage && (
              <>
                <br />
                <br />
                <strong>Details:</strong> {errorMessage}
              </>
            )}
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href={link}>Review e-invoicing settings</Button>
          </Section>

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default EInvoiceErrorEmail;
