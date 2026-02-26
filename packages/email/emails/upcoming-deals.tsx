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

export const UpcomingDealsEmail = ({
  count = 3,
  teamName = "Your Team",
  link = "https://app.abacuslabs.co/deals",
}: Props) => {
  // Link to deals filtered to show only recurring deals
  const viewLink = `${link}?recurring=true`;
  const text =
    count === 1
      ? "You have 1 deal scheduled for tomorrow"
      : `You have ${count} deals scheduled for tomorrow`;
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
                You have 1 deal <br />
                scheduled for tomorrow
              </>
            ) : (
              <>
                You have {count} deals <br />
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
              ? "A recurring deal is scheduled to be generated and sent tomorrow."
              : `${count} recurring deals are scheduled to be generated and sent tomorrow.`}
            <br />
            <br />
            You can review the recurring series settings or pause any series if
            needed before the deals are sent.
            <br />
            <br />
          </Text>

          <Section className="text-center mt-[50px] mb-[50px]">
            <Button href={viewLink}>View deals</Button>
          </Section>

          <br />

          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default UpcomingDealsEmail;
