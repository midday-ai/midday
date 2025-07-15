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
  EmailThemeProvider,
  getEmailInlineStyles,
  getEmailThemeClasses,
} from "../components/theme";

interface Props {
  applicationName: string;
  developerName?: string;
  teamName: string;
  userEmail: string;
}

export const AppReviewRequestEmail = ({
  applicationName = "Sample App",
  developerName = "John Doe",
  teamName = "Acme Inc",
  userEmail = "user@example.com",
}: Props) => {
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  return (
    <EmailThemeProvider
      preview={
        <Preview>Application Review Request - {applicationName}</Preview>
      }
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
            Application Review Request
          </Heading>

          <Section className="mb-[32px]">
            <Text
              className={`text-[14px] leading-[24px] ${themeClasses.text}`}
              style={{ color: lightStyles.text.color }}
            >
              A new application has been submitted for review:
            </Text>

            <Text
              className={`text-[14px] leading-[24px] ${themeClasses.text}`}
              style={{ color: lightStyles.text.color }}
            >
              <strong>Application Name:</strong> {applicationName}
            </Text>

            {developerName && (
              <Text
                className={`text-[14px] leading-[24px] ${themeClasses.text}`}
                style={{ color: lightStyles.text.color }}
              >
                <strong>Developer:</strong> {developerName}
              </Text>
            )}

            <Text
              className={`text-[14px] leading-[24px] ${themeClasses.text}`}
              style={{ color: lightStyles.text.color }}
            >
              <strong>Team:</strong> {teamName}
            </Text>

            <Text
              className={`text-[14px] leading-[24px] ${themeClasses.text}`}
              style={{ color: lightStyles.text.color }}
            >
              <strong>Submitted by:</strong> {userEmail}
            </Text>
          </Section>

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default AppReviewRequestEmail;
