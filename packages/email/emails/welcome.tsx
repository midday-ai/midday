import { getEmailUrl } from "@midday/utils/envs";
import {
  Body,
  Container,
  Heading,
  Img,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import { Footer } from "../components/footer";
import { GetStarted } from "../components/get-started";
import { Logo } from "../components/logo";
import {
  EmailThemeProvider,
  getEmailInlineStyles,
  getEmailThemeClasses,
} from "../components/theme";

interface Props {
  fullName: string;
}

const baseUrl = getEmailUrl();

export const WelcomeEmail = ({ fullName = "" }: Props) => {
  const firstName = fullName ? fullName.split(" ").at(0) : "";
  const text = `${firstName ? `Hi ${firstName}, ` : ""}Welcome to Abacus! It's really important to us that you have a great experience getting started.`;
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
            Welcome to Abacus
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
            Welcome to Abacus, the operating system for MCA businesses.
            <br />
            <br />
            We built Abacus to help MCA operators like you manage portfolios,
            track merchants, and make better decisions — all without the
            spreadsheet headaches. We're here when you need us.
            <br />
            <br />
            Take your time to explore Abacus at your own pace. If you ever want
            to chat with us, you can schedule a time{" "}
            <Link
              href="https://cal.com/abacus-labs"
              className={`underline ${themeClasses.link}`}
              style={{ color: lightStyles.text.color }}
            >
              here
            </Link>
            <br />
            <br />
            If there's anything we can do to help, just reply. We're always one
            message away.
          </Text>

          <br />

          <Text
            className={themeClasses.mutedText}
            style={{ color: lightStyles.mutedText.color }}
          >
            Best regards,
            <br />
            The Abacus Team
          </Text>

          <br />
          <br />

          <GetStarted />

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default WelcomeEmail;
