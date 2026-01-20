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
  requesterName: string;
  amount: number;
  currency: string;
  note?: string;
  teamName: string;
  link: string;
}

export const ExpenseSubmittedEmail = ({
  requesterName = "山田太郎",
  amount = 15000,
  currency = "JPY",
  note = "クライアント訪問の交通費",
  teamName = "マイチーム",
  link = "https://app.midday.ai/expense-approvals?id=xxx",
}: Props) => {
  const formattedAmount =
    currency === "JPY"
      ? `¥${amount.toLocaleString()}`
      : `${amount.toLocaleString()} ${currency}`;

  const text = `${requesterName}さんが経費承認を申請しました`;
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
            経費承認申請
          </Heading>

          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            {requesterName}さんから経費承認の申請がありました。
          </Text>

          <Section
            className="my-[20px] p-[20px] rounded-lg"
            style={{ backgroundColor: "#f5f5f5" }}
          >
            <Text
              className={`${themeClasses.text} m-0`}
              style={{ color: lightStyles.text.color }}
            >
              <strong>金額:</strong> {formattedAmount}
              <br />
              <strong>チーム:</strong> {teamName}
              {note && (
                <>
                  <br />
                  <strong>備考:</strong> {note}
                </>
              )}
            </Text>
          </Section>

          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            以下のボタンから詳細を確認し、承認または却下してください。
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href={link}>経費を確認する</Button>
          </Section>

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default ExpenseSubmittedEmail;
