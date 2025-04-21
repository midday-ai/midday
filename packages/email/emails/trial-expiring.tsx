import {
  Body,
  Button,
  Container,
  Font,
  Heading,
  Html,
  Link,
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

export const TrialExpiringEmail = ({ fullName = "Viktor Hofte" }: Props) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, Just a quick reminder—your Midday trial ends in 3 days. We hope you’ve had a great experience so far.`;

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
              Your Midday Trial is Expiring Soon
            </Heading>

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212]">
              Just a quick reminder—your Midday trial ends in 3 days. We hope
              you've had a great experience so far.
            </Text>
            <Text className="text-[#121212] text-[14px]">
              Since you joined during our limited Pro Plan offer, your discount
              has already been applied to your account. You still have time to
              claim it before your trial ends.
            </Text>
            <Section className="text-center mt-[50px] mb-[50px]">
              <Button
                className="bg-transparent text-primary text-[14px] text-[#121212] font-medium no-underline text-center px-6 py-3 border border-solid border-[#121212]"
                href="https://app.midday.ai/settings/billing"
              >
                Claim your discount
              </Button>
            </Section>
            <Text className="text-[#121212] text-[14px]">
              If you're unsure or have any questions, we'd love to hear from
              you. You can reply to this email or schedule a quick{" "}
              <Link
                href="https://cal.com/pontus-midday/15min"
                className="text-[#121212] underline"
              >
                call with us
              </Link>
              . We're always here to help.
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

export default TrialExpiringEmail;
