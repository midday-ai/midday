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
  link: string;
}

export const InvoiceEmail = ({
  customerName = "Customer",
  teamName = "Midday",
  link = "https://app.midday.ai/i/1234567890",
}: Props) => {
  const text = `You've Received an Invoice from ${teamName}`;
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
            You've Received an Invoice <br /> from {teamName}
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
            Please review your invoice and make sure to pay it on time. If you
            have any questions, feel free to reply to this email.
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href={link}>View invoice</Button>
          </Section>

          <br />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default InvoiceEmail;
