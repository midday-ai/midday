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
  unsubscribeLink: string;
}

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://midday.ai/email"
    : "http://localhost:3000/email";

export const PreAccountingEmail = ({
  fullName = "Viktor Hofte",
  unsubscribeLink = "https://midday.ai",
}: OverviewProps) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, Always have to dig up old receipts and invoices when your accountant asks for it? No more, with Midday everything is gathered, neatly structured and connected to transactions.`;

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
              Pre-accounting made easy for you <br />
              and your accountants
            </Heading>

            <br />

            <Img
              src={`${baseUrl}/pre-accounting-header.png`}
              alt="Vault"
              className="my-0 mx-auto block max-w-[597px] w-full"
            />

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212]">
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

            <Footer baseUrl={baseUrl} unsubscribeLink={unsubscribeLink} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PreAccountingEmail;
