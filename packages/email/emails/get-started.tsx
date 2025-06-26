import {
  Body,
  Container,
  Heading,
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

export const GetStartedEmail = ({ fullName = "Viktor Hofte" }: Props) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, Just checking in to help you get started. Here are a few things you can try today.`;
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
            Get the most out of Midday
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
            Just checking in to help you get started. Here are a few things you
            can try today:
          </Text>
          <br />
          <ul
            className={`list-none pl-0 text-[14px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            <li className="mb-2">
              <Text>
                <strong>Connect your bank account</strong> – Get a clear
                financial overview.
              </Text>
            </li>
            <li className="mb-2">
              <Text>
                <strong>Track your time</strong> – Stay on top of your hours and
                never lose billable time.
              </Text>
            </li>
            <li className="mb-2">
              <Text>
                <strong>Send your first invoice</strong> – Get paid faster and
                track overdue payments effortlessly.
              </Text>
            </li>
            <li className="mb-2">
              <Text>
                <strong>Reconcile transactions</strong> – Use Inbox to gather
                receipts and match them with transactions.
              </Text>
            </li>
            <li className="mb-2">
              <Text>
                <strong>Store important files</strong> – Keep contracts and
                agreements secure in Vault.
              </Text>
            </li>
            <li className="mb-2">
              <Text>
                <strong>Use the assistant</strong> – Gain insights and get a
                deeper understanding of your finances.
              </Text>
            </li>
            <li className="mb-2">
              <Text>
                <strong>Try the native desktop app</strong> – Faster access to
                stay in control of your business.
              </Text>
            </li>
          </ul>
          <br />
          <Text
            className={`text-[14px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Let us know if you have any thoughts or feedback—we'd love to hear
            from you. Just hit reply.
          </Text>
          <br />
          <Text
            className={`text-[14px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Best,
            <br />
            Pontus & Viktor
          </Text>

          <br />

          <GetStarted />

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default GetStartedEmail;
