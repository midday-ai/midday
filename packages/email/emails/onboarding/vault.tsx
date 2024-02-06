import {
  Body,
  Column,
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
import { Footer } from "../../components/footer";
import { GetStarted } from "../../components/get-started";
import { Logo } from "../../components/logo";

interface OverviewProps {
  fullName: string;
}

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://midday.ai/email"
    : "http://localhost:3000/email";

export const OverviewEmail = ({ fullName = "Viktor Hofte" }: OverviewProps) => {
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
              Vault
            </Heading>

            <Img
              src={`${baseUrl}/financial-overview-header.png`}
              width="597"
              height="301"
              alt="Overview"
              className="my-0 mx-auto block dark:hidden"
            />

            <Img
              src={`${baseUrl}/financial-overview-header-dark.png`}
              width="597"
              height="301"
              alt="Overview"
              className="my-0 mx-auto hidden dark:block"
            />

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
              <Row>
                <Column className="mr-4 block">
                  <Img
                    src={`${baseUrl}/profit-loss.png`}
                    width="245"
                    height="159"
                    alt="Profit/Loss"
                  />
                </Column>
                <Column className="align-top">
                  <Text className="pt-0 mt-0 font-medium">
                    Live profit/loss
                  </Text>
                  <Text className="text-[#707070]">
                    Keep track of your income and profit/loss. If you want you
                    can export the data for a shareable profit/loss.
                  </Text>
                </Column>
              </Row>
              <br />

              <Row>
                <Column className="mr-4 block">
                  <Img
                    src={`${baseUrl}/spending.png`}
                    width="245"
                    height="159"
                    alt="Spending"
                  />
                </Column>
                <Column className="align-top">
                  <Text className="pt-0 mt-0 font-medium">Spending</Text>
                  <Text className="text-[#707070]">
                    Effortlessly boost productivity and collaboration with our
                    advanced time tracking solution: gain insightful project
                    overviews and foster seamless collaboration amongst your
                    team for optimal efficiency and success.
                  </Text>
                </Column>
              </Row>

              <br />

              <Row>
                <Column className="mr-4 block">
                  <Img
                    src={`${baseUrl}/midday-ai.png`}
                    width="245"
                    height="159"
                    alt="Midday AI"
                  />
                </Column>
                <Column className="align-top">
                  <Text className="pt-0 mt-0 font-medium">
                    Ask Midday anything
                  </Text>
                  <Text className="text-[#707070]">
                    Understand your biggest spendings and your biggest incomes.
                    Ask Midday to find transactions without receipts or see
                    revenue patterns.
                  </Text>

                  <Text className="text-[#707070]">Powered by OpenAI</Text>
                </Column>
              </Row>
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

export default OverviewEmail;
