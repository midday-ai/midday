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

export const TrialActivationEmail = ({ fullName = "" }: Props) => {
  const firstName = fullName ? fullName.split(" ").at(0) : "";
  const text = `${firstName ? `Hi ${firstName}, ` : ""}Connect your bank account to get the most out of your Midday trial.`;
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
            Get the most out of your trial
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
            You signed up for Midday a few days ago — great start. The teams
            that get the most value all do one thing early: connect their bank
            account.
          </Text>
          <Text
            className={`text-[14px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Once connected, your transactions, spending overview, and financial
            reports update automatically. No spreadsheets, no manual entry.
          </Text>
          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href="https://app.midday.ai">Connect your bank</Button>
          </Section>
          <Text
            className={`text-[14px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            It takes about 30 seconds, and you'll immediately see your
            transactions flow in. If you need help getting set up,{" "}
            <Link
              href="https://cal.com/pontus-midday/15min"
              className={`underline ${themeClasses.link}`}
              style={{ color: lightStyles.text.color }}
            >
              book a quick call
            </Link>{" "}
            — we'll walk you through it.
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

export default TrialActivationEmail;
