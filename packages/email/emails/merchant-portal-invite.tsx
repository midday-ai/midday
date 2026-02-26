import { getAppUrl } from "@midday/utils/envs";
import {
  Body,
  Container,
  Heading,
  Img,
  Link,
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
  inviterName?: string;
  teamName?: string;
  teamLogoUrl?: string;
  merchantName?: string;
  inviteCode?: string;
}

const baseAppUrl = getAppUrl();

export const MerchantPortalInviteEmail = ({
  inviterName = "John Smith",
  email = "merchant@example.com",
  teamName = "ABC Funding",
  teamLogoUrl,
  merchantName = "Mike's Diner",
  inviteCode = "abc123xyz",
}: Props) => {
  const inviteLink = `${baseAppUrl}/portal/i/${inviteCode}`;
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  return (
    <EmailThemeProvider
      preview={
        <Preview>
          {inviterName} has invited you to access your merchant portal
        </Preview>
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
          {/* Team Logo or Abacus Logo */}
          {teamLogoUrl ? (
            <Section className="text-center mb-[24px]">
              <Img
                src={teamLogoUrl}
                width="80"
                height="80"
                alt={teamName}
                className="mx-auto object-contain"
              />
            </Section>
          ) : (
            <Logo />
          )}

          <Heading
            className={`mx-0 my-[30px] p-0 text-[24px] font-normal text-center ${themeClasses.heading}`}
            style={{ color: lightStyles.text.color }}
          >
            Access Your Merchant Portal
          </Heading>

          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Hello,
          </Text>

          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            {inviterName} from <strong>{teamName}</strong> has invited you to
            access the merchant portal for <strong>{merchantName}</strong>.
          </Text>

          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Through the merchant portal, you can:
          </Text>

          <ul className="text-[14px] leading-[24px] pl-[20px]">
            <li style={{ color: lightStyles.text.color }}>
              View your MCA balance and payment history
            </li>
            <li style={{ color: lightStyles.text.color }}>
              Track your repayment progress
            </li>
            <li style={{ color: lightStyles.text.color }}>
              Request payoff letters
            </li>
          </ul>

          <Section className="mb-[42px] mt-[32px] text-center">
            <Button href={inviteLink}>Accept Invitation</Button>
          </Section>

          <Text
            className={`text-[14px] leading-[24px] break-all ${themeClasses.mutedText}`}
            style={{ color: lightStyles.mutedText.color }}
          >
            Or copy and paste this link into your browser:{" "}
            <Link
              href={inviteLink}
              className={`underline ${themeClasses.mutedLink}`}
              style={{ color: lightStyles.mutedText.color }}
            >
              {inviteLink}
            </Link>
          </Text>

          <br />

          <Section>
            <Text
              className={`text-[12px] leading-[24px] ${themeClasses.mutedText}`}
              style={{ color: lightStyles.mutedText.color }}
            >
              This invitation was sent to{" "}
              <span
                className={themeClasses.text}
                style={{ color: lightStyles.text.color }}
              >
                {email}
              </span>
              . This link will expire in 7 days. If you did not expect this
              invitation, you can safely ignore this email.
            </Text>
          </Section>

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default MerchantPortalInviteEmail;
