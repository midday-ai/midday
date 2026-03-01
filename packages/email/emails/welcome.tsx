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

export const WelcomeEmail = ({ fullName = "" }: Props) => {
  const firstName = fullName ? fullName.split(" ").at(0) : "";
  const text = `${firstName ? `Hi ${firstName}, welcome` : "Welcome"} to Midday — built for founders like you.`;
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
            Welcome to Midday
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
            I'm Pontus, one of the founders of Midday.
            <br />
            <br />
            We started Midday after years of running our own companies — tired
            of juggling tools just to know where things stand. If that sounds
            familiar, you're in the right place.
            <br />
            <br />
            The best way to get started: connect your bank account. Everything
            else follows from there.
          </Text>

          <Section className="text-center mt-[32px] mb-[32px]">
            <Button href="https://app.midday.ai">Get started</Button>
          </Section>

          <Text
            className={`text-[14px] ${themeClasses.mutedText}`}
            style={{ color: lightStyles.mutedText.color }}
          >
            P.S. Want to talk? Reply here or{" "}
            <Link
              href="https://cal.com/pontus-midday/15min"
              className={`underline ${themeClasses.mutedLink}`}
              style={{ color: lightStyles.mutedText.color }}
            >
              book a quick call
            </Link>
            .
          </Text>

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default WelcomeEmail;
