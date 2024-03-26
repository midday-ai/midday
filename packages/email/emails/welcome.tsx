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
import * as React from "react";
import { Footer } from "../components/footer";
import { GetStarted } from "../components/get-started";
import { Logo } from "../components/logo";

interface OverviewProps {
  fullName: string;
  unsubscribeLink: string;
}

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://midday.ai/email"
    : "http://localhost:3000/email";

export const WelcomeEmail = ({
  fullName = "Viktor Hofte",
  unsubscribeLink = "https://midday.ai",
}: OverviewProps) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, Welcome to Midday! I'm Pontus, one of the founders. It's really important to us that you have a great experience ramping up.`;

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
            <Logo baseUrl={baseUrl} />
            <Heading className="text-[#121212] text-[21px] font-normal text-center p-0 my-[30px] mx-0">
              Welcome to Midday
            </Heading>

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212]">
              Welcome to Midday! I'm Pontus, one of the founders.
              <br />
              <br />
              We've been working on Midday for the past months, and during this
              time, we've implemented the basic functionality to get started.
              However, with your feedback, we can make the right decisions to
              help run your business smarter.
              <br />
              <br />
              During our private beta phase, you may encounter some bugs, but we
              genuinely want all your feedback.
              <br />
              <br />
              Should you have any questions, please don't hesitate to reply
              directly to this email or to{" "}
              <Link
                href="https://cal.com/pontus-midday/15min"
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
              className="my-0 mx-auto block w-full"
            />

            <Text className="text-[#707070]">Best regards, founders</Text>

            <Img
              src={`${baseUrl}/signature.png`}
              alt="Signature"
              className="block w-full w-[143px] h-[20px]"
            />

            {/* <Img
              src={`${baseUrl}/signature-dark.png`}
              alt="Signature"
              className="w-full w-[143px] h-[20px] hidden dark:block"
            /> */}

            <br />
            <br />

            <GetStarted />

            <br />

            <Footer baseUrl={baseUrl} unsubscribeLink={unsubscribeLink} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
