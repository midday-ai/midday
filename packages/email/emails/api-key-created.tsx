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
import { format } from "date-fns";
import { Logo } from "../components/logo";

interface Props {
  fullName: string;
  keyName: string;
  createdAt: string;
  email: string;
  ip: string;
}

export const ApiKeyCreatedEmail = ({
  fullName = "Viktor Hofte",
  keyName = "Midday API Key",
  createdAt = "May 28, 2025",
  email = "viktor@midday.ai",
  ip = "204.13.186.218",
}: Props) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName},\n\nYou've created a new API key with the name "${keyName}" on ${format(createdAt, "MMM d, yyyy")}. If this was not you, please contact support immediately.\n\nBest,\nThe Midday Team`;

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
              New Team API Key Created
            </Heading>

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212]">
              You've created a new API key with the name{" "}
              <strong>{keyName}</strong> on{" "}
              <strong>{format(createdAt, "MMM d, yyyy")}</strong>.
              <br />
            </Text>

            <Section className="text-center mt-[50px] mb-[50px]">
              <Button
                className="bg-transparent text-primary text-[14px] text-[#121212] font-medium no-underline text-center px-6 py-3 border border-solid border-[#121212]"
                href="https://app.midday.ai/settings/developer"
              >
                View API Keys
              </Button>
            </Section>

            <Section>
              <Text className="text-[12px] leading-[24px] text-[#666666]">
                This email was intended for{" "}
                <span className="text-[#121212]">{email}</span>. This email was
                sent from <span className="text-[#121212]">{ip}</span>. If you
                were not expecting this email, you can ignore this email. If you
                are concerned about your account's safety, please reply to this
                email to get in touch with us.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ApiKeyCreatedEmail;
