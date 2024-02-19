import {
  Body,
  Container,
  Font,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";
import { Column } from "../components/column";
import { Footer } from "../components/footer";
import { GetStarted } from "../components/get-started";
import { Logo } from "../components/logo";

interface OverviewProps {
  fullName: string;
}

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://midday.ai/email"
    : "http://localhost:3000/email";

export const GetStartedEmail = ({
  fullName = "Viktor Hofte",
}: OverviewProps) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, Lets get started! Follow the steps below and you’ll be up to speed in no time.`;

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
              Get started with Midday
            </Heading>

            <br />

            <Img
              src={`${baseUrl}/get-started-header.png`}
              alt="Get Started"
              className="my-0 mx-auto block max-w-[597px] w-full"
            />

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212]">
              Lets get started! Follow the steps below and you’ll be up to speed
              in no time.
            </Text>

            <br />
            <br />

            <Section>
              <Column
                title="Invite your team"
                description="Invite your team or a collegue that you think should have access to Midday."
                imgSrc={`${baseUrl}/get-started-invite.png`}
              />

              <Column
                title="Connect your bank"
                description="In order to get insights of your income, profit and loss, spending as well as the rest of financial overview you can connect your bank."
                imgSrc={`${baseUrl}/get-started-connect.png`}
              />

              <Column
                title="Run your bussiness smarter"
                description="Midday helps you see your bussiness full financial picture, track your projects with ease, see forecasted earnings, store important documents and takes the hassle out of preparing exports for your accountant"
                imgSrc={`${baseUrl}/get-started-overview.png`}
              />

              <Column
                title="Download Mac app"
                description="We like apps alot so we made Midday into one. We’ve tailored it as much as we can for a native experince but feel free to reach out if you find bugs or parts we can do better."
                imgSrc={`${baseUrl}/get-started-download.png`}
              />
            </Section>

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

export default GetStartedEmail;
