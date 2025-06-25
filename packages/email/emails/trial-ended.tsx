import {
  Body,
  Button,
  Container,
  Font,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { Footer } from "../components/footer";
import { Logo } from "../components/logo";

interface Props {
  fullName: string;
}

export const TrialEndedEmail = ({ fullName = "Viktor Hofte" }: Props) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, Your Midday trial has now ended, which means you have read-only access to your data.`;

  return (
    <Html>
      <Tailwind>
        <head>
          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/files/geist-sans-latin-400-normal.woff2",
              format: "woff2",
            }}
            fontWeight={400}
            fontStyle="normal"
          />

          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/files/geist-sans-latin-500-normal.woff2",
              format: "woff2",
            }}
            fontWeight={500}
            fontStyle="normal"
          />
        </head>
        <Preview>{text}</Preview>

        <Body className="bg-[#fff] my-auto mx-auto font-sans">
          <Container
            className="border-transparent md:border-[#E8E7E1] my-[40px] mx-auto p-[20px] max-w-[600px]"
            style={{ borderStyle: "solid", borderWidth: 1 }}
          >
            <Logo />
            <Heading className="text-[#121212] text-[21px] font-normal text-center p-0 my-[30px] mx-0">
              Your Midday Trial Has Ended
            </Heading>

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212]">
              Your Midday trial has now ended, which means you have read-only
              access to your data.
            </Text>
            <Text className="text-[#121212] text-[14px]">
              We know running a business is stressful, so if you need more time,
              your discount is still valid and applied to your account for{" "}
              <strong>1 more day</strong>.
            </Text>
            <Section className="text-center mt-[50px] mb-[50px]">
              <Button
                className="bg-transparent text-primary text-[14px] text-[#121212] font-medium no-underline text-center px-6 py-3 border border-solid border-[#121212]"
                href="https://app.midday.ai"
              >
                Upgrade now
              </Button>
            </Section>
            <Text className="text-[#121212] text-[14px]">
              If you decide not to continue, we'd truly appreciate your honest
              feedback—just reply and let us know why. We read every response.
            </Text>
            <Text className="text-[#121212] text-[14px]">
              If this is the last time we hear from you, thanks for giving
              Midday a try. We won't send any more emails, but you're always
              welcome back.
            </Text>
            <Text className="text-[#121212] text-[14px]">
              Best,
              <br />
              Pontus & Viktor
            </Text>

            <br />

            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default TrialEndedEmail;
