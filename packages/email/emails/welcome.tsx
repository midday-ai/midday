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

export const WelcomeEmail = ({ fullName = "Viktor Hofte" }: Props) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, Welcome to Midday! I'm Pontus, one of the founders. It's really important to us that you have a great experience ramping up.`;
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
            Welcome to Midday
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
            Welcome to Midday! I'm Pontus, one of the founders.
            <br />
            <br />
            We built Midday from over 10 years of running our own businesses,
            knowing firsthand the challenges that come with it. Midday is
            self-funded and built together with our customers, and it's
            important to us that you know we're here when you need us.
            <br />
            <br />
            Take your time to explore Midday at your own pace. If you ever want
            to chat with us founders, you can schedule a time{" "}
            <Link
              href="https://cal.com/pontus-midday/15min"
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

          <Img
            src={`${baseUrl}/email/founders.jpeg`}
            alt="Founders"
            className="my-0 mx-auto block w-full"
          />

          <Text
            className={themeClasses.mutedText}
            style={{ color: lightStyles.mutedText.color }}
          >
            Best regards, founders
          </Text>

          <style>{`
            .signature-blend {
              filter: none;
            }
            
            /* Regular dark mode - exclude Outlook.com */
            @media (prefers-color-scheme: dark) {
              .signature-blend:not([class^="x_"]) {
                filter: invert(1) brightness(1);
              }
            }
            
            /* Outlook.com specific dark mode targeting */
            [data-ogsb] .signature-blend,
            [data-ogsc] .signature-blend,
            [data-ogac] .signature-blend,
            [data-ogab] .signature-blend {
              filter: invert(1) brightness(1);
            }
          `}</style>

          <Img
            src={`${baseUrl}/email/signature.png`}
            alt="Signature"
            className="block w-full w-[143px] h-[20px] signature-blend"
          />

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
