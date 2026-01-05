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
  count: number;
  teamName?: string;
  link: string;
}

export const UpcomingInvoicesEmail = ({
  count = 3,
  teamName = "Your Team",
  link = "https://app.midday.ai/invoices",
}: Props) => {
  // Link to invoices filtered to show only recurring invoices
  const viewLink = `${link}?recurring=true`;
  const text =
    count === 1
      ? "You have 1 invoice scheduled for tomorrow"
      : `You have ${count} invoices scheduled for tomorrow`;
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
            {count === 1 ? (
              <>
                You have 1 invoice <br />
                scheduled for tomorrow
              </>
            ) : (
              <>
                You have {count} invoices <br />
                scheduled for tomorrow
              </>
            )}
          </Heading>

          <br />

          <Text
            className={themeClasses.text}
            style={{ color: lightStyles.text.color }}
          >
            {count === 1
              ? "A recurring invoice is scheduled to be generated and sent tomorrow."
              : `${count} recurring invoices are scheduled to be generated and sent tomorrow.`}
            <br />
            <br />
            You can review the recurring series settings or pause any series if
            needed before the invoices are sent.
            <br />
            <br />
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href={viewLink}>View invoices</Button>
          </Section>

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default UpcomingInvoicesEmail;
