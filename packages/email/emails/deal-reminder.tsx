import {
  Body,
  Container,
  Heading,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Logo } from "../components/logo";
import {
  Button,
  EmailThemeProvider,
  getEmailInlineStyles,
  getEmailThemeClasses,
} from "../components/theme";

interface Props {
  companyName: string;
  teamName: string;
  dealNumber: string;
  link: string;
}

export const DealReminderEmail = ({
  companyName = "Customer",
  teamName = "Abacus",
  dealNumber = "DEAL-0001",
  link = "https://app.abacuslabs.co/i/1234567890",
}: Props) => {
  const text = `Reminder: Payment for ${dealNumber}`;
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
            Payment Reminder: Deal {dealNumber} <br />
            from {teamName}
          </Heading>

          <br />

          <span
            className={`font-medium ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Hi {companyName},
          </span>
          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            This is a friendly reminder about your pending deal. We kindly
            ask you to review and process the payment at your earliest
            convenience. If you have any questions or need clarification, please
            don't hesitate to reply to this email.
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href={link}>View deal</Button>
          </Section>

          <br />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default DealReminderEmail;
