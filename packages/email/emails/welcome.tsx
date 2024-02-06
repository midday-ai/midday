import {
  Body,
  Container,
  Font,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";
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

export const WelcomeEmail = ({ fullName = "Viktor Hofte" }: OverviewProps) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, We connect to the majority of banks worldwide, making it easier for you to keep track of all your expenses and income in one place. Filter and compare different time periods to better track your business.`;

  return (
    <Html>
      <Tailwind>
        <Head>
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
          <Font
            fontFamily="Instrument Sans"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://fonts.gstatic.com/s/instrumentsans/v1/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0She1ZuWi3hKpA.woff2",
              format: "woff2",
            }}
          />
          <Font
            fontFamily="Instrument Sans"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://fonts.gstatic.com/s/instrumentsans/v1/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-yp2JGEJOH9npST3-TfykywN2u7ZWwU.woff2",
              format: "woff2",
            }}
            fontWeight={500}
          />
        </Head>
        <Preview>{text}</Preview>

        <Body className="bg-[#fff] dark:bg-[#121212] my-auto mx-auto font-sans">
          <br />
          <Container className="border-0 md:border-1 border-solid border-[#E8E7E1] dark:border-[#242424] my-[40px] mx-auto p-[20px] max-w-[560px]">
            <Logo baseUrl={baseUrl} />
            <Heading className="text-[#121212] dark:text-[#F5F5F3] text-[21px] font-normal text-center p-0 my-[30px] mx-0">
              Welcome to Midday
            </Heading>
            {/* 
            <br />

            <Img
              src={`${baseUrl}/financial-overview-header.png`}
              alt="Overview"
              className="my-0 mx-auto block dark:hidden max-w-[597px] w-full"
            />

            <Img
              src={`${baseUrl}/financial-overview-header-dark.png`}
              alt="Overview"
              className="my-0 mx-auto hidden dark:block w-full max-w-[597px] max-h-[301px]"
            />

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212] dark:text-[#F5F5F3]">
              We connect to the majority of banks worldwide, making it easier
              for you to keep track of all your expenses and income in one
              place. Filter and compare different time periods to better track
              your business.
            </Text>

            <br />
            <br />

            <Section>
              <Column
                title="Live profit/loss"
                description="Keep track of your income and profit/loss. If you want you can export
          the data for a shareable profit/loss."
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
            </Section> */}

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
