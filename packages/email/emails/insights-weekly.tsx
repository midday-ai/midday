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
  periodLabel: string;
  title?: string;
  insightId: string;
  locale?: string;
}

const baseAppUrl = getAppUrl();

export const InsightsWeeklyEmail = ({
  fullName = "",
  periodLabel = "Week 2, 2026",
  title = "Revenue up 23% with healthy margins - your weekly breakdown is ready.",
  insightId = "preview-insight-id",
  locale = "en",
}: Props) => {
  const firstName = fullName ? fullName.split(" ").at(0) : "";
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  const previewText = `${periodLabel}: ${title.slice(0, 100)}`;
  const dashboardUrl = `${baseAppUrl}/?insight=${insightId}`;

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

          {/* Period Label Header */}
          <Heading
            className={`text-[21px] font-normal text-center p-0 my-[30px] mx-0 ${themeClasses.heading}`}
            style={{ color: lightStyles.text.color }}
          >
            {periodLabel}
          </Heading>

          {/* Greeting */}
          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            {firstName ? `Hi ${firstName},` : "Hello,"}
          </Text>

          {/* Summary */}
          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            {title}
          </Text>

          {/* CTA Button */}
          <Section className="text-center mt-[32px] mb-[32px]">
            <Button href={dashboardUrl}>View breakdown</Button>
          </Section>

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default InsightsWeeklyEmail;
