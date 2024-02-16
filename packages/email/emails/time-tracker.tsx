import {
  Body,
  Container,
  Font,
  Head,
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
    ? "https://email.midday.ai/static"
    : "http://localhost:3003/static";

export const TimeTrackerEmail = ({
  fullName = "Viktor Hofte",
}: OverviewProps) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, Boost your productivity with our advanced time-tracking tool. With insightful project overviews and seamless collaboration amongst your team, you’re set up for optimal efficiency.`;

  return (
    <Html>
      <Tailwind>
        <head>
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
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

        <Body className="bg-[#fff] dark:bg-[#121212] my-auto mx-auto font-sans">
          <Container
            className="border-transparent md:border-[#E8E7E1] md:dark:border-[#242424] my-[40px] mx-auto p-[20px] max-w-[600px]"
            style={{ borderStyle: "solid", borderWidth: 1 }}
          >
            <Logo baseUrl={baseUrl} />
            <Heading className="text-[#121212] dark:text-[#F5F5F3] text-[21px] font-normal text-center p-0 my-[30px] mx-0">
              Time track your projects
            </Heading>

            <br />

            <Img
              src={`${baseUrl}/time-tracker-header.png`}
              alt="Vault"
              className="my-0 mx-auto block dark:hidden max-w-[597px] w-full"
            />

            <Img
              src={`${baseUrl}/time-tracker-header-dark.png`}
              alt="Vault"
              className="my-0 mx-auto hidden dark:block w-full max-w-[597px] max-h-[301px]"
            />

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212] dark:text-[#F5F5F3]">
              Boost your productivity with our advanced time-tracking tool. With
              insightful project overviews and seamless collaboration amongst
              your team, you’re set up for optimal efficiency.
            </Text>

            <br />
            <br />

            <Section>
              <Column
                title="Create a project and invite"
                description="Start by creating projects. If you have a larger team, no worries, invite them too."
                imgSrc={`${baseUrl}/tracker-project.png`}
              />

              <Column
                title="Track your hours"
                description="Mark your days and fill in your tracking record. You can also add your hourly fee to be able to forecast earnings."
                imgSrc={`${baseUrl}/tracker-log.png`}
              />

              <Column
                title="See total time spent"
                description="Keep a great overview of your and your teams spent time. Connect those hours to your invoice later for your ease and as a bonus your client gets a great overview."
                imgSrc={`${baseUrl}/tracker-overview.png`}
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

export default TimeTrackerEmail;
