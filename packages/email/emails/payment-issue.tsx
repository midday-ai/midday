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
  fullName: string;
  teamName: string;
}

const baseAppUrl = getAppUrl();

export const PaymentIssueEmail = ({
  fullName = "",
  teamName = "Midday",
}: Props) => {
  const firstName = fullName ? fullName.split(" ").at(0) : "";
  const previewText = `Your last payment for ${teamName} didn't go through.`;
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  return (
    <EmailThemeProvider preview={<Preview>{previewText}</Preview>}>
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
            Payment Issue
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
            Your last payment for <strong>{teamName}</strong> didn't go through.
            <br />
            <br />
            You won't lose access right away, but to keep things running you'll
            need to update your payment method.
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href={`${baseAppUrl}/settings/billing`}>
              Update payment method
            </Button>
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

export default PaymentIssueEmail;
