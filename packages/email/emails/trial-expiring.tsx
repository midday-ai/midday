import {
  Body,
  Container,
  Heading,
  Link,
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

export const TrialExpiringEmail = ({ fullName = "" }: Props) => {
  const firstName = fullName ? fullName.split(" ").at(0) : "";
  const text = `${firstName ? `Hi ${firstName}, ` : ""}Your Midday trial ends tomorrow — your subscription will begin automatically.`;
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
            Your trial ends tomorrow
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
            Just a heads up — your 14-day Midday trial ends tomorrow and your
            subscription will begin automatically. Your card on file will be
            charged for your selected plan.
          </Text>
          <Text
            className={`text-[14px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Everything you've set up — bank connections, invoicing, receipt
            matching, and financial reports — will continue working without
            interruption.
          </Text>
          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href="https://app.midday.ai/settings/billing">
              Manage subscription
            </Button>
          </Section>
          <Text
            className={`text-[14px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            If you'd like to cancel before your trial ends, you can do so from
            your{" "}
            <Link
              href="https://app.midday.ai/settings/billing"
              className={`underline ${themeClasses.link}`}
              style={{ color: lightStyles.text.color }}
            >
              billing settings
            </Link>
            . Have questions? Reply to this email or{" "}
            <Link
              href="https://cal.com/pontus-midday/15min"
              className={`underline ${themeClasses.link}`}
              style={{ color: lightStyles.text.color }}
            >
              book a quick call
            </Link>
            .
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

export default TrialExpiringEmail;
