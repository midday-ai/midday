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
  fullName: string;
}

export const TrialEndedEmail = ({ fullName = "" }: Props) => {
  const firstName = fullName ? fullName.split(" ").at(0) : "";
  const text = `${firstName ? `Hi ${firstName}, ` : ""}Your Midday trial has ended — upgrade now to pick up right where you left off.`;
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
            className={`font-serif text-[21px] font-normal text-center p-0 my-[30px] mx-0 ${themeClasses.heading}`}
            style={{ color: lightStyles.text.color }}
          >
            Your Midday Trial Has Ended
          </Heading>

          <br />

          <span
            className={`font-medium ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            {firstName ? `Hi ${firstName},` : "Hello,"}
          </span>
          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            Your Midday trial has ended. Your account is now in read-only mode,
            but all your data — transactions, invoices, reports — is still there
            waiting for you.
          </Text>
          <Text
            className={`text-[14px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Upgrade to pick up right where you left off. It takes less than a
            minute.
          </Text>
          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href="https://app.midday.ai/upgrade">Upgrade now</Button>
          </Section>
          <Text
            className={`text-[14px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            If Midday isn't the right fit, we'd genuinely appreciate your
            feedback — just reply and let us know. We read every response.
          </Text>
          <Text
            className={`text-[14px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Either way, thanks for giving us a try. You're always welcome back.
          </Text>
          <Text
            className={`text-[14px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Best,
            <br />
            Pontus & Viktor
          </Text>

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default TrialEndedEmail;
