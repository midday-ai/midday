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
  opener: string;
  audioUrl?: string;
  insightId: string;
  locale?: string;
}

const baseAppUrl = getAppUrl();

export const InsightReadyEmail = ({
  fullName = "",
  periodLabel = "Week 2, 2026",
  opener = "Your revenue grew 12% this week, with profit margins improving across all categories.",
  audioUrl,
  insightId = "preview-insight-id",
  locale = "en",
}: Props) => {
  const firstName = fullName ? fullName.split(" ").at(0) : "";
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  const previewText = `Your ${periodLabel} business insight is ready: ${opener.slice(0, 100)}`;
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

          <Heading
            className={`text-[21px] font-normal text-center p-0 my-[30px] mx-0 ${themeClasses.heading}`}
            style={{ color: lightStyles.text.color }}
          >
            Your {periodLabel} Insight
          </Heading>

          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            {firstName ? `Hi ${firstName},` : "Hello,"}
          </Text>

          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Your {periodLabel.toLowerCase()} business insight is ready.
          </Text>

          {/* Insight Highlight */}
          <Section
            className="my-[24px] p-[16px] rounded-[8px]"
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <Text
              className="text-[14px] leading-[22px] m-0"
              style={{ color: "#1e293b" }}
            >
              {opener}
            </Text>
          </Section>

          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.mutedText}`}
            style={{ color: lightStyles.mutedText.color }}
          >
            Check your dashboard for the full story, key metrics, and
            recommended actions to grow your business.
          </Text>

          {/* CTA Buttons */}
          <Section className="text-center mt-[32px] mb-[16px]">
            <Button href={dashboardUrl}>View breakdown</Button>
          </Section>

          {audioUrl && (
            <Section className="text-center mb-[32px]">
              <Button href={audioUrl} variant="secondary">
                Listen to breakdown
              </Button>
            </Section>
          )}

          <br />
          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default InsightReadyEmail;
