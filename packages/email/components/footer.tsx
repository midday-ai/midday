import { getEmailUrl } from "@midday/utils/envs";
import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { LogoFooter } from "./logo-footer";
import { getEmailInlineStyles, getEmailThemeClasses } from "./theme";

const baseUrl = getEmailUrl();

export function Footer() {
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  return (
    <Section className="w-full">
      <Hr
        className={themeClasses.border}
        style={{ borderColor: lightStyles.container.borderColor }}
      />

      <Text
        className={`font-serif text-[21px] font-normal mt-[40px] mb-[40px] ${themeClasses.text}`}
        style={{ color: lightStyles.text.color }}
      >
        Run your business smarter.
      </Text>

      <Row>
        <Column className="align-middle w-[40px]">
          <Link href="https://go.midday.ai/lS72Toq">
            <Img
              src={`${baseUrl}/email/x.png`}
              width="18"
              height="18"
              alt="X"
            />
          </Link>
        </Column>
        <Column className="align-middle">
          <Link href="https://go.midday.ai/Ct3xybK">
            <Img
              src={`${baseUrl}/email/linkedin.png`}
              width="22"
              height="22"
              alt="LinkedIn"
            />
          </Link>
        </Column>
      </Row>

      <br />

      <Text
        className={`text-[13px] leading-relaxed ${themeClasses.mutedText}`}
        style={{ color: lightStyles.mutedText.color }}
      >
        <Link
          href="https://midday.ai"
          className={themeClasses.mutedLink}
          style={{ color: lightStyles.mutedText.color }}
        >
          Website
        </Link>
        {" · "}
        <Link
          href="https://midday.ai/pricing"
          className={themeClasses.mutedLink}
          style={{ color: lightStyles.mutedText.color }}
        >
          Pricing
        </Link>
        {" · "}
        <Link
          href="https://go.midday.ai/ZrhEMbR"
          className={themeClasses.mutedLink}
          style={{ color: lightStyles.mutedText.color }}
        >
          Support
        </Link>
        {" · "}
        <Link
          href="https://app.midday.ai/settings/notifications"
          className={themeClasses.mutedLink}
          style={{ color: lightStyles.mutedText.color }}
        >
          Notifications
        </Link>
      </Text>

      <Text
        className={`text-xs ${themeClasses.secondaryText}`}
        style={{ color: lightStyles.secondaryText.color }}
      >
        Midday Labs AB · Torsgatan 59, 113 37 Stockholm, Sweden
      </Text>

      <br />

      <LogoFooter />
    </Section>
  );
}
