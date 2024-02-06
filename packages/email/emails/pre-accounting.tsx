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

export const PreAccountingEmail = ({
  fullName = "Viktor Hofte",
}: OverviewProps) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, Always have to dig up old receipts and invoices when your accountant asks for it? No more, with Midday everything is gathered, neatly structured and connected to transactions.`;

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
              Pre-accounting made easy for you <br />
              and your accountants
            </Heading>

            <br />

            <Img
              src={`${baseUrl}/pre-accounting-header.png`}
              alt="Vault"
              className="my-0 mx-auto block dark:hidden max-w-[597px] w-full"
            />

            <Img
              src={`${baseUrl}/pre-accounting-header-dark.png`}
              alt="Vault"
              className="my-0 mx-auto hidden dark:block w-full max-w-[597px] max-h-[301px]"
            />

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212] dark:text-[#F5F5F3]">
              Always have to dig up old receipts and invoices when your
              accountant asks for it? No more, with Midday everything is
              gathered, neatly structured and connected to transactions.
            </Text>

            <br />
            <br />

            <Section>
              <Column
                title="Categorize your transactions"
                description="Many transactions will automatically be categorized when added to Midday but sometimes you have to do it yourself. Midday will learn and be better with time. Everything to be able show better and better spending data."
                imgSrc={`${baseUrl}/pre-accounting-categories.png`}
              />

              <Column
                title="Use inbox or manually upload receipts"
                description="Either you can use our magic inbox to automatically link receipts to your transactions or you can attach them yourself. In the end either will help you been on top and organized when your accountant is asking for them."
                imgSrc={`${baseUrl}/pre-accounting-attachments.png`}
              />

              <Column
                title="Export to your accountant"
                description="Select any timeframe you want and export your transactions, now with the attached receipt or invoice. Midday will also notify you if you export something has a missing attachment."
                imgSrc={`${baseUrl}/pre-accounting-export.png`}
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

export default PreAccountingEmail;
