import {
  Body,
  Container,
  Heading,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { format } from "date-fns";
import { Logo } from "../components/logo";
import {
  Button,
  EmailThemeProvider,
  getEmailInlineStyles,
  getEmailThemeClasses,
} from "../components/theme";

interface Props {
  fullName: string;
  keyName: string;
  createdAt: string;
  email: string;
  ip: string;
}

export const ApiKeyCreatedEmail = ({
  fullName = "",
  keyName = "Midday API Key",
  createdAt = "May 28, 2025",
  email = "user@example.com",
  ip = "204.13.186.218",
}: Props) => {
  // Extract firstName from fullName, or use empty string for generic greeting
  const firstName = fullName?.trim() ? fullName.split(" ").at(0) : "";
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";

  const text = `${greeting}\n\nYou've created a new API key with the name "${keyName}" on ${format(new Date(createdAt), "MMM d, yyyy")}. If this was not you, please contact support immediately.\n\nBest,\nThe Midday Team`;
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
            New Team API Key Created
          </Heading>

          <br />

          <span
            className={`font-medium ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            {greeting}
          </span>
          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            You've created a new API key with the name{" "}
            <strong>{keyName}</strong> on{" "}
            <strong>{format(new Date(createdAt), "MMM d, yyyy")}</strong>.
            <br />
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href="https://app.midday.ai/settings/developer">
              View API Keys
            </Button>
          </Section>

          <Section>
            <Text
              className={`text-[12px] leading-[24px] ${themeClasses.mutedText}`}
              style={{ color: lightStyles.mutedText.color }}
            >
              This email was intended for{" "}
              <span
                className={themeClasses.text}
                style={{ color: lightStyles.text.color }}
              >
                {email}
              </span>
              . This email was sent from{" "}
              <span
                className={themeClasses.text}
                style={{ color: lightStyles.text.color }}
              >
                {ip}
              </span>
              . If you were not expecting this email, you can ignore this email.
              If you are concerned about your account's safety, please reply to
              this email to get in touch with us.
            </Text>
          </Section>
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default ApiKeyCreatedEmail;
