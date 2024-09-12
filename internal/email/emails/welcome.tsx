import {
  Body,
  Container,
  Font,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";

import { Footer } from "../components/footer";
import { GetStarted } from "../components/get-started";
import { Logo } from "../components/logo";

interface WelcomeProps {
  fullName: string;
}

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://solomon-ai.app/email"
    : "http://localhost:3000/email";

export const WelcomeEmail = ({ fullName = "Viktor Hofte" }: WelcomeProps) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, Welcome to Solomon AI! I'm Yoan, one of the founders. It's really important to us that you have a great experience ramping up.`;

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
              Welcome to Solomon AI
            </Heading>

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212]">
              Welcome to Solomon AI! I'm Yoan, one of the founders.
              <br />
              <br />
              We've been working on Solomon AI for the past months, and during
              this time, we've implemented the basic functionality to get
              started. However, with your feedback, we can make the right
              decisions to help run your business smarter.
              <br />
              <br />
              During our beta phase, you may encounter some bugs, but we
              genuinely want all your feedback.
              <br />
              <br />
              Should you have any questions, please don't hesitate to reply
              directly to this email or to{" "}
              <Link
                href="https://cal.com/solomonai/15min"
                className="text-[#121212] underline"
              >
                schedule a call with me
              </Link>
              .
            </Text>

            <br />

            <Img
              src={`${baseUrl}/founders.jpeg`}
              alt="Founders"
              className="mx-auto my-0 block w-full"
            />

            <Text className="text-[#707070]">Best regards, founders</Text>

            <br />
            <br />

            <GetStarted />

            <br />

            <Footer baseUrl={baseUrl} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
