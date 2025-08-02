import { getAppUrl } from "@midday/utils/envs";
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
  email?: string;
  teamName?: string;
  appName?: string;
}

const baseAppUrl = getAppUrl();

export const AppInstalledEmail = ({
  email = "pontus@lostisland.co",
  teamName = "Midday Labs AB",
  appName = "Raycast",
}: Props) => {
  const appLink = `${baseAppUrl}/apps`;
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  return (
    <EmailThemeProvider
      preview={<Preview>An app has been added to your team</Preview>}
    >
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
            className={`mx-0 my-[30px] p-0 text-[24px] font-normal text-center ${themeClasses.heading}`}
            style={{ color: lightStyles.text.color }}
          >
            An app has been added to your team
          </Heading>

          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            The <strong>{appName}</strong> app has been added to your workspace{" "}
            <strong>{teamName}</strong> on <strong>Midday</strong>.
          </Text>
          <Section className="mb-[42px] mt-[32px] text-center">
            <Button href={appLink}>View installed app</Button>
          </Section>

          <br />
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
              . If you were not expecting this email, you can ignore this email.
              If you are concerned about your account's safety, please reply to
              this email to get in touch with us.
            </Text>
          </Section>

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default AppInstalledEmail;
