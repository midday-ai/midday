import {
  Body,
  Container,
  Heading,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { addDays, formatDistance } from "date-fns";
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
  expiresAt: string;
  bankName: string;
  teamName: string;
}

export const ConnectionExpireEmail = ({
  fullName = "Viktor Hofte",
  expiresAt = addDays(new Date(), 4).toISOString(),
  bankName = "Revolut",
  teamName = "Midday",
}: Props) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, We wanted to inform you that our connection to your bank ${bankName} for your team ${teamName} will expire in ${formatDistance(new Date(expiresAt), new Date())}.`;
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
            Bank Connection Expiring Soon
          </Heading>

          <br />

          <span
            className={`font-medium ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Hi {firstName},
          </span>
          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            We hope you're having a great day!
            <br />
            <br />
            We wanted to inform you that our connection to your bank{" "}
            <strong>{bankName}</strong> for your team{" "}
            <strong>{teamName}</strong> will expire in{" "}
            {formatDistance(new Date(expiresAt), new Date())}. To ensure that
            Midday continues to run smoothly, please reconnect your bank.
            <br />
            <br />
            The good news? It only takes 60 seconds to get everything back on
            track!
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href="https://go.midday.ai/34Xt7XK">Reconnect</Button>
          </Section>

          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            If you have any questions, please don't hesitate to reach out by
            just replying to this email.
          </Text>

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default ConnectionExpireEmail;
