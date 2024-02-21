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

export const FinancialOverviewEmail = ({
  fullName = "Pontus Abrahamsson",
}: OverviewProps) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, We connect to the majority of banks worldwide, making it easier for you to keep track of all your expenses and income in one place. Filter and compare different time periods to better track your business.`;

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
              Financial overview
            </Heading>

            <br />

            <Img
              src={`${baseUrl}/financial-overview-header.png`}
              alt="Overview"
              className="my-0 mx-auto block max-w-[597px] w-full"
            />

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212]">
              We connect to the majority of banks worldwide, making it easier
              for you to keep track of all your expenses and income in one
              place. Filter and compare different time periods to better track
              your business.
            </Text>

            <br />
            <br />

            <Section>
              <Column
                title="Live profit/revenue"
                description="Keep track of your income and profit/revenue. If you want you can export
          the data for a shareable profit/revenue."
                imgSrc={`${baseUrl}/profit-loss.png`}
              />

              <Column
                title="Spending"
                description="Effortlessly boost productivity and collaboration with our
                advanced time tracking solution: gain insightful project
                overviews and foster seamless collaboration amongst your
                team for optimal efficiency and success."
                imgSrc={`${baseUrl}/spending.png`}
              />

              <Column
                title="Ask Midday anything"
                description="Understand your biggest spendings and your biggest incomes.
                Ask Midday to find transactions without receipts or see
                revenue patterns."
                footer="Powered by OpenAI"
                imgSrc={`${baseUrl}/midday-ai.png`}
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

export default FinancialOverviewEmail;
