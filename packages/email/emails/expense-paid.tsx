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
  teamName: string;
  link: string;
}

export const ExpensePaidEmail = ({
  requesterName = "山田太郎",
  amount = 15000,
  currency = "JPY",
  teamName = "マイチーム",
  link = "https://app.midday.ai/expense-approvals?id=xxx",
}: Props) => {
  const formattedAmount =
    currency === "JPY"
      ? `¥${amount.toLocaleString()}`
      : `${amount.toLocaleString()} ${currency}`;

  const text = `経費が支払われました: ${formattedAmount}`;
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
            経費が支払われました
          </Heading>

          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            {requesterName}さんの経費申請が支払い処理されました。
          </Text>

          <Section
            className="my-[20px] p-[20px] rounded-lg"
            style={{ backgroundColor: "#e3f2fd" }}
          >
            <Text
              className={`${themeClasses.text} m-0`}
              style={{ color: lightStyles.text.color }}
            >
              <strong>支払金額:</strong> {formattedAmount}
              <br />
              <strong>チーム:</strong> {teamName}
            </Text>
          </Section>

          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            詳細は以下のボタンから確認できます。
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href={link}>詳細を確認する</Button>
          </Section>

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default ExpensePaidEmail;
