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

interface WelcomeProps {
  fullName: string;
  expiresAt: string;
  bankName: string;
  teamName: string;
}

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://solomon-ai.app/email"
    : "http://localhost:3000/email";

export const ConnectionExpireEmail = ({
  fullName = "Yoan Yomba",
  expiresAt = addDays(new Date(), 4).toISOString(),
  bankName = "Revolut",
  teamName = "Solomon AI",
}: WelcomeProps) => {
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

        <Body className="mx-auto my-auto bg-[#fff] font-sans">
          <Container
            className="mx-auto my-[40px] max-w-[600px] border-transparent p-[20px] md:border-[#E8E7E1]"
            style={{ borderStyle: "solid", borderWidth: 1 }}
          >
            <Logo baseUrl={baseUrl} />
            <Heading className="mx-0 my-[30px] p-0 text-center text-[21px] font-normal text-[#121212]">
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
              Solomon AI continues to run smoothly, please reconnect your bank.
              <br />
              <br />
              The good news? It only takes 60 seconds to get everything back on
              track!
            </Text>

            <Section className="mb-[50px] mt-[50px] text-center">
              <Button
                className="rounded-md border border-solid border-[#121212] bg-transparent px-6 py-3 text-center text-[14px] font-medium text-[#121212] text-primary no-underline"
                href="https://solomon-ai.app/"
              >
                Reconnect
              </Button>
            </Section>

            <br />

            <Footer baseUrl={baseUrl} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ConnectionExpireEmail;
