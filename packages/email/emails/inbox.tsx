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

export const InboxEmail = ({ fullName = "Viktor Hofte" }: OverviewProps) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, With your own personalised email address together with Midday AI, you get automatic matching of incoming invoices or receipts to the correct transaction. When it comes time to export, all of your transactions and attachments are ready to go.`;

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
          <Container className="border-0 md:border-1 border-solid border-[#E8E7E1] dark:border-[#242424] my-[40px] mx-auto p-[20px] max-w-[600px]">
            <Logo baseUrl={baseUrl} />
            <Heading className="text-[#121212] dark:text-[#F5F5F3] text-[21px] font-normal text-center p-0 my-[30px] mx-0">
              Magic Inbox
            </Heading>

            <Img
              src={`${baseUrl}/magic-inbox-header.png`}
              alt="Overview"
              className="my-0 mx-auto block dark:hidden max-w-[597px] w-full"
            />

            <Img
              src={`${baseUrl}/magic-inbox-header-dark.png`}
              alt="Overview"
              className="my-0 mx-auto hidden dark:block w-full max-w-[597px] max-h-[301px]"
            />

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212] dark:text-[#F5F5F3]">
              With your own personalised email address together with Midday AI,
              you get automatic matching of incoming invoices or receipts to the
              correct transaction. When it comes time to export, all of your
              transactions and attachments are ready to go.
            </Text>

            <br />
            <br />

            <Section>
              <Column
                title="Use your personilized email"
                description="Copy your personilized Midday email and add it as a receipient to any purchase or subscription."
                imgSrc={`${baseUrl}/inbox-email.png`}
              />

              <Column
                title="Automatic mapping to an existing transaction"
                description="When the receipt or invoice is recieved, Midday automatically scans the invoice and finds the transaction. Voila, your transaction now has a the right attachment. "
                imgSrc={`${baseUrl}/inbox-mapping.png`}
              />

              <Column
                title="Export"
                description="Select any timeframe you want and export your transactions, now with the attached receipt or invoice."
                imgSrc={`${baseUrl}/inbox-export.png`}
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

export default InboxEmail;
