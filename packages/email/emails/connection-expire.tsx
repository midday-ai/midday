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
import { addDays, formatDistance } from "date-fns";
import { Footer } from "../components/footer";
import { Logo } from "../components/logo";

interface Props {
  fullName: string;
  expiresAt: string;
  bankName: string;
  teamName: string;
}

export const ConnectionExpireEmail = ({
  fullName = "Viktor Hofte",
  expiresAt = addDays(new Date(), 4).toISOString(),
  bankName = "Revolut",
  teamName = "Midday",
}: Props) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, We wanted to inform you that our connection to your bank ${bankName} for your team ${teamName} will expire in ${formatDistance(new Date(expiresAt), new Date())}.`;

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
              Bank Connection Expiring Soon
            </Heading>

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212]">
              We hope you're having a great day!
              <br />
              <br />
              We wanted to inform you that our connection to your bank{" "}
              <strong>{bankName}</strong> for your team{" "}
              <strong>{teamName}</strong> will expire in{" "}
              {formatDistance(new Date(expiresAt), new Date())}. To ensure that
              Midday continues to run smoothly, please reconnect your bank.
              <br />
              <br />
              The good news? It only takes 60 seconds to get everything back on
              track!
            </Text>

            <Section className="text-center mt-[50px] mb-[50px]">
              <Button
                className="bg-transparent text-primary text-[14px] text-[#121212] font-medium no-underline text-center px-6 py-3 border border-solid border-[#121212]"
                href="https://go.midday.ai/34Xt7XK"
              >
                Reconnect
              </Button>
            </Section>

            <Text className="text-[#121212]">
              If you have any questions, please don't hesitate to reach out by
              just replying to this email.
            </Text>

            <br />

            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ConnectionExpireEmail;
