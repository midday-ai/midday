import { getAppUrl } from "@midday/utils/envs";
import {
  Body,
  Container,
  Heading,
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
import { getI18n } from "../locales";

interface Props {
  email?: string;
  invitedByEmail?: string;
  invitedByName?: string;
  teamName?: string;
  ip?: string;
  locale: string;
}

const baseAppUrl = getAppUrl();

export const InviteEmail = ({
  invitedByEmail = "bukinoshita@example.com",
  invitedByName = "Pontus Abrahamsson",
  email = "pontus@lostisland.co",
  teamName = "Acme Co",
  ip = "204.13.186.218",
  locale = "en",
}: Props) => {
  const { t } = getI18n({ locale });
  const inviteLink = `${baseAppUrl}/teams`;
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  return (
    <EmailThemeProvider
      preview={<Preview>{t("invite.preview", { teamName })}</Preview>}
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
            {t("invite.title1")} <strong>{teamName}</strong>{" "}
            {t("invite.title2")} <strong>Midday</strong>
          </Heading>

          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            {invitedByName} (
            <Link
              href={`mailto:${invitedByEmail}`}
              className={`no-underline ${themeClasses.link}`}
              style={{ color: lightStyles.text.color }}
            >
              {invitedByEmail}
            </Link>
            ) {t("invite.link1")} <strong>{teamName}</strong>{" "}
            {t("invite.link2")} <strong>Midday</strong>.
          </Text>
          <Section className="mb-[42px] mt-[32px] text-center">
            <Button href={inviteLink}>{t("invite.join")}</Button>
          </Section>

          <Text
            className={`text-[14px] leading-[24px] break-all ${themeClasses.mutedText}`}
            style={{ color: lightStyles.mutedText.color }}
          >
            {t("invite.link3")}:{" "}
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
              {t("invite.footer1")}{" "}
              <span
                className={themeClasses.text}
                style={{ color: lightStyles.text.color }}
              >
                {email}
              </span>
              . {t("invite.footer2")}{" "}
              <span
                className={themeClasses.text}
                style={{ color: lightStyles.text.color }}
              >
                {ip}
              </span>{" "}
              . {t("invite.footer4")}
            </Text>
          </Section>

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default InviteEmail;
