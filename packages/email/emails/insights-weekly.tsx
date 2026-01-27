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
  audioUrl?: string;
}

const baseAppUrl = getAppUrl();

export const InsightsWeeklyEmail = ({
  fullName = "",
  periodLabel = "Week 2, 2026",
  title = "Revenue up 23% with healthy margins - your weekly breakdown is ready.",
  insightId = "preview-insight-id",
  locale = "en",
  audioUrl,
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

          {/* Greeting and Summary */}
          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            {firstName ? `Hi ${firstName},` : "Hi,"} here's your weekly summary:{" "}
            {title}
          </Text>

          {/* CTA Buttons */}
          <Section className="text-center mt-[56px] mb-[56px]">
            <table
              align="center"
              border={0}
              cellPadding={0}
              cellSpacing={0}
              role="presentation"
            >
              <tr>
                <td style={{ paddingRight: audioUrl ? 8 : 0 }}>
                  <Button href={dashboardUrl}>View details</Button>
                </td>
                {audioUrl && (
                  <td style={{ paddingLeft: 8 }}>
                    <Button href={audioUrl}>Listen to summary</Button>
                  </td>
                )}
              </tr>
            </table>
            {audioUrl && (
              <Text
                className="text-[12px] mt-[16px] mb-0"
                style={{ color: "#6b7280" }}
              >
                Audio link expires in 7 days
              </Text>
            )}
          </Section>

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default InsightsWeeklyEmail;
