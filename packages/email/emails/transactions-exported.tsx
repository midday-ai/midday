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
  teamName: string;
  transactionCount: number;
  downloadLink: string;
}

export const TransactionsExportedEmail = ({
  teamName = "Midday",
  transactionCount = 100,
  downloadLink = "https://app.midday.ai/s/abc123",
}: Props) => {
  const text = `Transaction Export from ${teamName}`;
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
            Transaction Export from {teamName}
          </Heading>

          <br />

          <span
            className={`font-medium ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Hi,
          </span>
          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            {teamName} has shared a transaction export with you containing{" "}
            {transactionCount} transaction{transactionCount !== 1 ? "s" : ""}.
            Click the button below to download the file.
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href={downloadLink}>Download Export</Button>
          </Section>

          <Text
            className={`text-[12px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            This link will expire in 7 days. If you have any questions about
            this export, please contact {teamName}.
          </Text>

          <br />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default TransactionsExportedEmail;
